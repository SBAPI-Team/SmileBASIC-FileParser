import "./Helpers";
import ndarray from "ndarray";
import { FILE_OFFSETS, META_FILE_MAGIC } from "./Constants";
import { SmileBASICFileType } from "./SmileBASICFileType";

/**
 * Provides an interface to the content of a {@link SmileBASICFileType.Meta} file.
 */
class SmileBASICMetaContent {
    /** The name of the project, shown in the project list. */
    public ProjectName: string;
    /** The description of the project, shown in the project list. */
    public ProjectDescription: string;
    /** The icon used for this project, shown in the project list. */
    public IconContent: Buffer;

    /**
     * @internal @hidden
     * Used to override the length of descriptions. Only used for parsing specific entities in SBAPI.
     * You should never need to use this. If you do, let me know.
     */
    public DescriptionOverride: number;

    /** The total calculated size of the project. */
    public get Size(): number {
        return FILE_OFFSETS.SB4[ SmileBASICFileType.Meta ][ "PROJECT_DESCRIPTION" ] + this.DescriptionOverride + 4 + this.IconContent.length + 4;
    }

    /** Creates an empty instancce. */
    public constructor() {
        this.ProjectName = "";
        this.ProjectDescription = "";
        this.IconContent = Buffer.alloc(0);
        this.DescriptionOverride = FILE_OFFSETS.SB4[ SmileBASICFileType.Meta ][ "PROJECT_DESCRIPTION_LENGTH" ];
    }

    /**
     * Creates an instance of {@link SmileBASICMetaContent}, with the provided raw content as an input.
     * @param input The raw META file content to parse.
     * @returns The parsed META content.
     */
    public static FromBuffer(input: Buffer): SmileBASICMetaContent;

    /**
     * Creates an instance of {@link SmileBASICMetaContent}, with the provided raw content as an input and overriding the length of the META file's description field.
     * 
     * You probably don't want to use this overload unless you're doing something really weird here. This is an escape hatch for a specific piece of SBAPI functionality.
     * @internal @hidden
     * @param input The raw META file content to parse.
     * @param overrideDescriptionLength You shouldn't need to use this. Leave this parameter alone unless you're doing something weird, and if you are, please do let me know, since it likely means there's missing functionality.
     * @returns The parsed META content.
     */
    public static FromBuffer(input: Buffer, overrideDescriptionLength?: number): SmileBASICMetaContent;
    public static FromBuffer(input: Buffer, overrideDescriptionLength: number = FILE_OFFSETS.SB4[ SmileBASICFileType.Meta ][ "PROJECT_DESCRIPTION_LENGTH" ]): SmileBASICMetaContent {
        let output = new SmileBASICMetaContent();
        output.DescriptionOverride = overrideDescriptionLength;

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
            FILE_OFFSETS.SB4[ SmileBASICFileType.Meta ][ "PROJECT_DESCRIPTION" ] + overrideDescriptionLength);

        projectName = projectName.substr(0, projectName.indexOf('\0'));
        projectDescription = projectDescription.substr(0, projectDescription.indexOf('\0'));

        let iconWidth = input.readUInt32LE(FILE_OFFSETS.SB4[ SmileBASICFileType.Meta ][ "PROJECT_DESCRIPTION" ] + overrideDescriptionLength);
        let iconBufferSize = (iconWidth ** 2) * 4;

        let iconBuffer = Buffer.allocUnsafe(iconBufferSize);
        input.copy(iconBuffer, 0, FILE_OFFSETS.SB4[ SmileBASICFileType.Meta ][ "PROJECT_DESCRIPTION" ] + overrideDescriptionLength + 4, FILE_OFFSETS.SB4[ SmileBASICFileType.Meta ][ "PROJECT_DESCRIPTION" ] + overrideDescriptionLength + 4 + iconBufferSize);

        output.ProjectName = projectName;
        output.ProjectDescription = projectDescription;
        output.IconContent = iconBuffer;

        return output;
    }

    /**
     * Converts the instance into a Buffer containing raw META content.
     * @returns A Promise that resolves to the raw META data.
     */
    public async ToBuffer(): Promise<Buffer> {
        let metaHeader = Buffer.allocUnsafe(FILE_OFFSETS.SB4[ SmileBASICFileType.Meta ][ "ICON_WIDTH" ] + 4);

        metaHeader.write(META_FILE_MAGIC, FILE_OFFSETS.SB4[ SmileBASICFileType.Meta ][ "MAGIC" ], 8, "ascii");
        metaHeader.write(this.ProjectName + "\0", FILE_OFFSETS.SB4[ SmileBASICFileType.Meta ][ "PROJECT_NAME" ], FILE_OFFSETS.SB4[ SmileBASICFileType.Meta ][ "PROJECT_NAME_LENGTH" ], "ucs2");
        metaHeader.write(this.ProjectDescription + "\0", FILE_OFFSETS.SB4[ SmileBASICFileType.Meta ][ "PROJECT_DESCRIPTION" ], FILE_OFFSETS.SB4[ SmileBASICFileType.Meta ][ "PROJECT_DESCRIPTION_LENGTH" ], "ucs2");

        let iconBuffer = this.IconContent;

        let iconWidth = Math.sqrt(iconBuffer.length / 4);
        if (iconWidth % 1 !== 0) {
            throw new Error("Icon is not square!");
        }

        metaHeader.writeUInt32LE(iconWidth, FILE_OFFSETS.SB4[ SmileBASICFileType.Meta ][ "ICON_WIDTH" ]);
        let output = Buffer.concat([
            metaHeader,
            iconBuffer,
            Buffer.alloc(4)
        ]);

        return output;
    }
}

export { SmileBASICMetaContent };