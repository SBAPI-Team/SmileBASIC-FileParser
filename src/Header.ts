import { FILE_OFFSETS } from "./Constants";
import { SmileBASICFileVersion } from "./SmileBASICFileVersion";
import { Author } from "./Author";

class Header {
    public Version: SmileBASICFileVersion;
    public FileType: number;
    public IsCompressed: boolean;
    public FileIcon: number;
    public Size: number;
    public LastModified: Date;
    public Creator: Author;
    public Editor: Author;


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

    public static FromBuffer(input: Buffer): Header {
        let header = new Header();

        let version = input.readUInt16LE(FILE_OFFSETS['VERSION']);

        if (version <= 4)
            header.Version = SmileBASICFileVersion.SB3;
        else
            header.Version = SmileBASICFileVersion.SB4;

        header.FileType = input.readUInt16LE(FILE_OFFSETS['FILE_TYPE']);
        header.IsCompressed = (input.readUInt16LE(FILE_OFFSETS['FILE_ZLIB']) & 0x01) === 1;
        header.FileIcon = input.readUInt16LE(FILE_OFFSETS['FILE_ICON']);
        header.Size = input.readUInt32LE(FILE_OFFSETS['FILE_SIZE']);

        header.LastModified = new Date(
            input.readUInt16LE(FILE_OFFSETS['DATE_YEAR']),
            input[FILE_OFFSETS['DATE_MONTH']] - 1, // (-1 because months in JS are 0-indexed)
            input[FILE_OFFSETS['DATE_DAY']],
            input[FILE_OFFSETS['DATE_HOUR']],
            input[FILE_OFFSETS['DATE_MINUTE']],
            input[FILE_OFFSETS['DATE_SECOND']]
        );

        switch (header.Version) {
            case SmileBASICFileVersion.SB3:
                header.Creator = new Author(
                    input.readUInt32LE(FILE_OFFSETS.SB3["AUTHOR1_UID"]),
                    input.toString("ascii", FILE_OFFSETS.SB3["AUTHOR1_NAME"], FILE_OFFSETS.SB3["AUTHOR1_NAME"] + FILE_OFFSETS.SB3["NAME_SIZE"])
                );
                header.Editor = new Author(
                    input.readUInt32LE(FILE_OFFSETS.SB3["AUTHOR2_UID"]),
                    input.toString("ascii", FILE_OFFSETS.SB3["AUTHOR2_NAME"], FILE_OFFSETS.SB3["AUTHOR2_NAME"] + FILE_OFFSETS.SB3["NAME_SIZE"])
                );

                break;
            case SmileBASICFileVersion.SB4:
                header.Creator = new Author(
                    input.readUInt32LE(FILE_OFFSETS.SB4["AUTHOR1_UID"]),
                    input.toString("ascii", FILE_OFFSETS.SB4["AUTHOR1_NAME"], FILE_OFFSETS.SB4["AUTHOR1_NAME"] + FILE_OFFSETS.SB4["NAME_SIZE"])
                );
                header.Editor = new Author(
                    input.readUInt32LE(FILE_OFFSETS.SB4["AUTHOR2_UID"]),
                    input.toString("ascii", FILE_OFFSETS.SB4["AUTHOR2_NAME"], FILE_OFFSETS.SB4["AUTHOR2_NAME"] + FILE_OFFSETS.SB4["NAME_SIZE"])
                );
                break;
            default:
                throw new Error(`File version ${SmileBASICFileVersion[header.Version]}`);
        }

        return header;
    }
}

export { Header };