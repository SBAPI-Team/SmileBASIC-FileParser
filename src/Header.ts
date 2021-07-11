import { FILE_OFFSETS } from "./Constants";
import { SmileBASICFileVersion } from "./SmileBASICFileVersion";
import { Author } from "./Author";

/**
 * Stores the Header information of a SmileBASIC format file.
 */
class Header {
    /** The normalized version of this SmileBASIC file. */
    public Version: SmileBASICFileVersion;
    /** The raw type of this file. */
    public FileType: number;
    /** Whether or not the file's content is compressed using zlib. */
    public IsCompressed: boolean;
    /** The raw icon ID shown in the SmileBASIC file browser. */
    public FileIcon: number;
    /** The size of this file in bytes. Shown in the SmileBASIC file browser. */
    public Size: number;
    /** The last time this file was saved. */
    public LastModified: Date;
    /** The author who created this file. Not shown in the SmileBASIC file browser. */
    public Creator: Author;
    /** The author who edited/uploaded this file. Shown in the SmileBASIC file browser. */
    public Editor: Author;


    /**
     * Creates a new, empty Header instance.
     */
    public constructor() {
        this.Version = SmileBASICFileVersion.SB3;
        this.FileType = 0;
        this.IsCompressed = false;
        this.FileIcon = 0;
        this.Size = 0;
        this.LastModified = new Date();
        this.Creator = new Author(0, "");
        this.Editor = new Author(0, "");
    }

    /**
     * Creates a Header instance from a raw Buffer containg a SmileBASIC file.
     * @param input The Buffer storing the raw SmileBASIC file to parse.
     * @returns A Header instance, prepopulated with the information from the raw SmileBASIC file.
     */
    public static FromBuffer(input: Buffer): Header {
        let header = new Header();

        let version = input.readUInt16LE(FILE_OFFSETS[ 'VERSION' ]);

        if (version < 4)
            header.Version = SmileBASICFileVersion.SB3;
        else
            header.Version = SmileBASICFileVersion.SB4;

        header.FileType = input.readUInt16LE(FILE_OFFSETS[ 'FILE_TYPE' ]);
        header.IsCompressed = (input.readUInt16LE(FILE_OFFSETS[ 'FILE_ZLIB' ]) & 0x01) === 1;
        header.FileIcon = input.readUInt16LE(FILE_OFFSETS[ 'FILE_ICON' ]);
        header.Size = input.readUInt32LE(FILE_OFFSETS[ 'FILE_SIZE' ]);

        header.LastModified = new Date(
            input.readUInt16LE(FILE_OFFSETS[ 'DATE_YEAR' ]),
            input[ FILE_OFFSETS[ 'DATE_MONTH' ] ] - 1, // (-1 because months in JS are 0-indexed)
            input[ FILE_OFFSETS[ 'DATE_DAY' ] ],
            input[ FILE_OFFSETS[ 'DATE_HOUR' ] ],
            input[ FILE_OFFSETS[ 'DATE_MINUTE' ] ],
            input[ FILE_OFFSETS[ 'DATE_SECOND' ] ]
        );

        switch (header.Version) {
            case SmileBASICFileVersion.SB3:
                header.Creator = new Author(
                    input.readUInt32LE(FILE_OFFSETS.SB3[ "AUTHOR1_UID" ]),
                    input.toString("utf8", FILE_OFFSETS.SB3[ "AUTHOR1_NAME" ], FILE_OFFSETS.SB3[ "AUTHOR1_NAME" ] + FILE_OFFSETS.SB3[ "NAME_SIZE" ])
                );
                header.Editor = new Author(
                    input.readUInt32LE(FILE_OFFSETS.SB3[ "AUTHOR2_UID" ]),
                    input.toString("utf8", FILE_OFFSETS.SB3[ "AUTHOR2_NAME" ], FILE_OFFSETS.SB3[ "AUTHOR2_NAME" ] + FILE_OFFSETS.SB3[ "NAME_SIZE" ])
                );

                break;
            case SmileBASICFileVersion.SB4:
                header.Creator = new Author(
                    input.readUInt32LE(FILE_OFFSETS.SB4[ "AUTHOR1_UID" ]),
                    input.toString("utf8", FILE_OFFSETS.SB4[ "AUTHOR1_NAME" ], FILE_OFFSETS.SB4[ "AUTHOR1_NAME" ] + FILE_OFFSETS.SB4[ "NAME_SIZE" ])
                );
                header.Editor = new Author(
                    input.readUInt32LE(FILE_OFFSETS.SB4[ "AUTHOR2_UID" ]),
                    input.toString("utf8", FILE_OFFSETS.SB4[ "AUTHOR2_NAME" ], FILE_OFFSETS.SB4[ "AUTHOR2_NAME" ] + FILE_OFFSETS.SB4[ "NAME_SIZE" ])
                );
                break;
            default:
                throw new Error(`File version ${SmileBASICFileVersion[ header.Version ] ?? header.Version} is not implemented.`);
        }

        return header;
    }

    /**
     * Returns a Buffer storing the contents of this instance in the format expected by SmileBASIC.
     * @returns A Buffer with the information stored by this instance.
     */
    public ToBuffer(): Buffer {
        let buffer: Buffer;

        switch (this.Version) {
            case SmileBASICFileVersion.SB3:
                buffer = Buffer.alloc(FILE_OFFSETS.SB3[ "HEADER_SIZE" ]);
                buffer.writeUInt16LE(0x01, FILE_OFFSETS[ "VERSION" ]);

                buffer.write(
                    this.Creator.Username + "\0",
                    FILE_OFFSETS.SB3[ "NAME_SIZE" ]
                );
                buffer.write(
                    this.Editor.Username + "\0",
                    FILE_OFFSETS.SB3[ "AUTHOR2_NAME" ],
                    FILE_OFFSETS.SB3[ "NAME_SIZE" ]
                );
                buffer.writeUInt32LE(this.Creator.UID, FILE_OFFSETS.SB3[ "AUTHOR1_UID" ]);
                buffer.writeUInt32LE(this.Editor.UID, FILE_OFFSETS.SB3[ "AUTHOR2_UID" ]);
                break;
            case SmileBASICFileVersion.SB4:
                buffer = Buffer.alloc(FILE_OFFSETS.SB4[ "HEADER_SIZE" ]);
                buffer.writeUInt16LE(0x04, FILE_OFFSETS[ "VERSION" ]);

                buffer.write(
                    this.Creator.Username,
                    FILE_OFFSETS.SB4[ "AUTHOR1_NAME" ],
                    FILE_OFFSETS.SB4[ "NAME_SIZE" ]
                );
                buffer.write(
                    this.Editor.Username,
                    FILE_OFFSETS.SB4[ "AUTHOR2_NAME" ],
                    FILE_OFFSETS.SB4[ "NAME_SIZE" ]
                );
                buffer.writeUInt32LE(this.Creator.UID, FILE_OFFSETS.SB4[ "AUTHOR1_UID" ]);
                buffer.writeUInt32LE(this.Editor.UID, FILE_OFFSETS.SB4[ "AUTHOR2_UID" ]);
                break;
            default:
                throw new Error(`File version ${SmileBASICFileVersion[ this.Version ] ?? this.Version} is not implemented.`);
        }

        buffer.writeUInt16LE(this.FileType, FILE_OFFSETS[ "FILE_TYPE" ]);
        buffer.writeUInt16LE(this.IsCompressed ? 1 : 0, FILE_OFFSETS[ "FILE_ZLIB" ]);
        buffer.writeUInt16LE(this.FileIcon, FILE_OFFSETS[ "FILE_ICON" ]);
        buffer.writeUInt32LE(this.Size, FILE_OFFSETS[ "FILE_SIZE" ]);

        buffer.writeUInt16LE(this.LastModified.getFullYear(), FILE_OFFSETS[ "DATE_YEAR" ]);
        buffer.writeUInt8(this.LastModified.getMonth() + 1, FILE_OFFSETS[ "DATE_MONTH" ]);
        buffer.writeUInt8(this.LastModified.getDate(), FILE_OFFSETS[ "DATE_DAY" ]);
        buffer.writeUInt8(this.LastModified.getHours(), FILE_OFFSETS[ "DATE_HOUR" ]);
        buffer.writeUInt8(this.LastModified.getMinutes(), FILE_OFFSETS[ "DATE_MINUTE" ]);
        buffer.writeUInt8(this.LastModified.getSeconds(), FILE_OFFSETS[ "DATE_SECOND" ]);

        return buffer;
    }
}

export { Header };