import { FILE_OFFSETS } from "./Constants";
import { Header } from "./Header";
import { SmileBASICFile } from "./SmileBASICFile";
import { SmileBASICFileType } from "./SmileBASICFileType";
import { SmileBASICMetaContent } from "./SmileBASICMetaContent";

/** Provides an interface to the content of a {@link SmileBASICFileType.Project4} file. */
class SmileBASIC4ProjectContent {
    /** Stores the metadata parsed directly from the Project file. */
    public MetaContent: SmileBASICMetaContent;
    /**
     * A Map linking file names to parsed {@link SmileBASICFile SmileBASICFiles}.
     * Do note that to do anything more than basic checks, you will need to use {@link SmileBASICFile.ToActualType ToActualType()} on the file.
     * */
    public Files: Map<string, SmileBASICFile>;

    /**
     * A Map linking file names to unparsed raw file content.
     */
    public RawFiles: Map<string, Buffer>;

    /** Creates an empty instance. */
    public constructor() {
        this.MetaContent = new SmileBASICMetaContent();
        this.Files = new Map();
        this.RawFiles = new Map();
    }

    /**
     * Creates an instance of {@link SmileBASIC4ProjectContent}, with the provided raw content as an input.
     * @param input The raw Project4 content to parse.
     * @returns A Promise resolving to the parsed Project4 content.
     */
    public static async FromBuffer(input: Buffer): Promise<SmileBASIC4ProjectContent> {
        let output = new SmileBASIC4ProjectContent();

        let meta = SmileBASICMetaContent.FromBuffer(input);
        let offset = meta.Size;

        output.MetaContent = meta;

        let projectSize = input.readUInt32LE(offset + FILE_OFFSETS.SB4[ SmileBASICFileType.Project4 ][ "PROJECT_SIZE" ]);
        let fileCount = input.readUInt32LE(offset + FILE_OFFSETS.SB4[ SmileBASICFileType.Project4 ][ "PROJECT_FILE_COUNT" ]);

        let currentOffset = offset + FILE_OFFSETS.SB4[ SmileBASICFileType.Project4 ][ "PROJECT_FILE_COUNT" ]
            + (fileCount * FILE_OFFSETS.SB4[ SmileBASICFileType.Project4 ][ "PROJECT_ENTRY_LENGTH" ]) + 4;

        for (let i = 0; i < fileCount; i++) {
            let entryOffset = offset + FILE_OFFSETS.SB4[ SmileBASICFileType.Project4 ][ "PROJECT_SIZE" ] + FILE_OFFSETS.SB4[ SmileBASICFileType.Project4 ][ "PROJECT_FILE_COUNT" ]
                + 4 + (i * FILE_OFFSETS.SB4[ SmileBASICFileType.Project4 ][ "PROJECT_ENTRY_LENGTH" ]);

            let entrySize = input.readUInt32LE(entryOffset);
            let entryName = input.toString("ascii", entryOffset + 4, entryOffset + 4 + 36);
            entryName = entryName.substr(0, entryName.indexOf('\0'));

            let fileBuffer = input.slice(currentOffset, currentOffset += entrySize);
            output.RawFiles.set(entryName, fileBuffer);

            let projectFile = await SmileBASICFile.FromBuffer(fileBuffer, false);

            // TODO: Author inheritance
            output.Files.set(entryName, projectFile);
        }

        return output;
    }

    /**
     * Converts the instance into a Buffer containing raw Project4 content.
     * @returns A Promise that resolves to the raw Project4 data.
     */
    public async ToBuffer(): Promise<Buffer> {
        let metaHeader = await this.MetaContent.ToBuffer();

        let fileCount = this.Files.size;
        let prjHeader = Buffer.allocUnsafe(8 + (fileCount * FILE_OFFSETS.SB4[ SmileBASICFileType.Project4 ][ "PROJECT_ENTRY_LENGTH" ]));
        let allBuffers = [ prjHeader ];
        let offset = 8;
        for (let [ name, subfile ] of this.Files) {
            let buffer = await subfile.ToBuffer();
            prjHeader.writeUInt32LE(buffer.length, offset);
            prjHeader.write(name + "\0", offset += 4, 36, "ascii");
            offset += 36;

            allBuffers.push(buffer);
        }
        prjHeader.writeUInt32LE(fileCount, FILE_OFFSETS.SB4[ SmileBASICFileType.Project4 ][ "PROJECT_FILE_COUNT" ]);
        let output = Buffer.concat(allBuffers);
        output.writeUInt32LE(output.length, FILE_OFFSETS.SB4[ SmileBASICFileType.Project4 ][ "PROJECT_SIZE" ]);

        return Buffer.concat([ metaHeader, output ]);
    }
}

export { SmileBASIC4ProjectContent };