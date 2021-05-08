import { FILE_OFFSETS } from "./Constants";
import { SmileBASICFile } from "./SmileBASICFile";
import { SmileBASICFileType } from "./SmileBASICFileType";

class SmileBASIC3ProjectContent {
    public Files: Map<string, SmileBASICFile>;

    public constructor() {
        this.Files = new Map();
    }

    public static async FromBuffer(input: Buffer): Promise<SmileBASIC3ProjectContent> {
        let output = new SmileBASIC3ProjectContent();

        let projectSize = input.readUInt32LE(FILE_OFFSETS.SB3[ SmileBASICFileType.Project3 ][ "PROJECT_SIZE" ]);
        let fileCount = input.readUInt32LE(FILE_OFFSETS.SB3[ SmileBASICFileType.Project3 ][ "PROJECT_FILE_COUNT" ]);

        let currentOffset = FILE_OFFSETS.SB3[ SmileBASICFileType.Project3 ][ "PROJECT_SIZE" ] + FILE_OFFSETS.SB3[ SmileBASICFileType.Project3 ][ "PROJECT_FILE_COUNT" ]
            + (fileCount * FILE_OFFSETS.SB3[ SmileBASICFileType.Project3 ][ "PROJECT_ENTRY_LENGTH" ]) + 4;

        for (let i = 0; i < fileCount; i++) {
            let entryOffset = FILE_OFFSETS.SB3[ SmileBASICFileType.Project3 ][ "PROJECT_SIZE" ] + FILE_OFFSETS.SB3[ SmileBASICFileType.Project3 ][ "PROJECT_FILE_COUNT" ]
                + 4 + (i * FILE_OFFSETS.SB3[ SmileBASICFileType.Project3 ][ "PROJECT_ENTRY_LENGTH" ]);

            let entrySize = input.readUInt32LE(entryOffset);
            let entryName = input.toString("ascii", entryOffset + 4, entryOffset + 4 + 16);
            entryName = entryName.substr(0, entryName.indexOf('\0'));

            let fileBuffer = input.slice(currentOffset, currentOffset += entrySize);
            let projectFile = await SmileBASICFile.FromBuffer(fileBuffer, true);

            // TODO: Author inheritance
            output.Files.set(entryName, projectFile);
        }

        return output;
    }

    public async ToBuffer(): Promise<Buffer> {
        let fileCount = this.Files.size;

        let prjHeader = Buffer.allocUnsafe(8 + (fileCount * FILE_OFFSETS.SB3[ SmileBASICFileType.Project3 ][ "PROJECT_ENTRY_LENGTH" ]));
        let allBuffers = [ prjHeader ];
        let offset = 8;
        for (let [ name, subfile ] of this.Files) {
            let buffer = await subfile.ToBuffer();
            prjHeader.writeUInt32LE(buffer.length, offset);
            prjHeader.write(name + "\0", offset += 4, 16, "ascii");
            offset += 16;

            allBuffers.push(buffer);
        }
        prjHeader.writeUInt32LE(fileCount, FILE_OFFSETS.SB3[ SmileBASICFileType.Project3 ][ "PROJECT_FILE_COUNT" ]);
        let output = Buffer.concat(allBuffers);
        output.writeUInt32LE(output.length, FILE_OFFSETS.SB3[ SmileBASICFileType.Project3 ][ "PROJECT_SIZE" ]);

        return output;
    }
}

export { SmileBASIC3ProjectContent };