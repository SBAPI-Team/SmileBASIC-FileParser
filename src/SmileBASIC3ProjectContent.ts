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
            + (fileCount * FILE_OFFSETS.SB3[ SmileBASICFileType.Project3 ][ "PROJECT_ENTRY_LENGTH" ]);

        for (let i = 0; i < fileCount; i++) {
            let entryOffset = FILE_OFFSETS.SB3[ SmileBASICFileType.Project3 ][ "PROJECT_SIZE" ] + FILE_OFFSETS.SB3[ SmileBASICFileType.Project3 ][ "PROJECT_FILE_COUNT" ]
                + (i * FILE_OFFSETS.SB3[ SmileBASICFileType.Project3 ][ "PROJECT_ENTRY_LENGTH" ]);

            let entrySize = input.readUInt32LE(entryOffset);
            let entryName = input.toString("ascii", entryOffset + 4, entryOffset + 4 + 16);
            entryName = entryName.substr(0, entryName.indexOf('\0'));

            let fileBuffer = input.slice(currentOffset, currentOffset + entrySize);
            output.Files.set(entryName, await SmileBASICFile.FromBuffer(fileBuffer));
        }

        return output;
    }

    // TODO: Implement SmileBASIC3ProjectContent#ToBuffer()
    public ToBuffer() { }
}

export { SmileBASIC3ProjectContent };