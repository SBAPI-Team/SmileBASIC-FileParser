import ndarray from "ndarray";
import { FILE_OFFSETS, META_FILE_MAGIC } from "./Constants";
import { SmileBASICFileType } from "./SmileBASICFileType";

class SmileBASICMetaContent {
    public ProjectName: string;
    public ProjectDescription: string;
    public IconContent: ndarray;

    public get Size(): number {
        return FILE_OFFSETS.SB4[ SmileBASICFileType.Meta ][ "ICON_START" ] + this.IconContent.data.length + 4;
    }

    public constructor() {
        this.ProjectName = "";
        this.ProjectDescription = "";
        this.IconContent = ndarray([]);
    }

    public static FromBuffer(input: Buffer): SmileBASICMetaContent {
        let output = new SmileBASICMetaContent();

        let magic = input.toString("ascii",
            FILE_OFFSETS.SB4[ SmileBASICFileType.Meta ][ "MAGIC" ],
            FILE_OFFSETS.SB4[ SmileBASICFileType.Meta ][ "MAGIC" ] + 8);
        if (magic !== META_FILE_MAGIC) {
            throw new Error("Invalid META file magic");
        }

        let projectName = input.toString("ucs2",
            FILE_OFFSETS.SB4[ SmileBASICFileType.Meta ][ "PROJECT_NAME" ],
            FILE_OFFSETS.SB4[ SmileBASICFileType.Meta ][ "PROJECT_NAME" ] + FILE_OFFSETS.SB4[ SmileBASICFileType.Meta ][ "PROJECT_NAME_LENGTH" ]);

        let projectDescription = input.toString("ucs2",
            FILE_OFFSETS.SB4[ SmileBASICFileType.Meta ][ "PROJECT_DESCRIPTION" ],
            FILE_OFFSETS.SB4[ SmileBASICFileType.Meta ][ "PROJECT_DESCRIPTION" ] + FILE_OFFSETS.SB4[ SmileBASICFileType.Meta ][ "PROJECT_DESCRIPTION_LENGTH" ]);

        projectName = projectName.substr(0, projectName.indexOf('\0'));
        projectDescription = projectDescription.substr(0, projectDescription.indexOf('\0'));

        let iconWidth = input.readUInt32LE(FILE_OFFSETS.SB4[ SmileBASICFileType.Meta ][ "ICON_WIDTH" ]);
        let iconBufferSize = (iconWidth ** 2) * 4;

        let iconBuffer = Buffer.allocUnsafe(iconBufferSize);
        input.copy(iconBuffer, 0, FILE_OFFSETS.SB4[ SmileBASICFileType.Meta ][ "ICON_START" ]);

        output.ProjectName = projectName;
        output.ProjectDescription = projectDescription;
        output.IconContent = ndarray(iconBuffer.swapBGRA(), [ iconWidth, iconWidth, 4 ]);

        return output;
    }

    // TODO: Implement SmileBASICMetaContent#ToBuffer()
    public ToBuffer() { }
}

export { SmileBASICMetaContent };