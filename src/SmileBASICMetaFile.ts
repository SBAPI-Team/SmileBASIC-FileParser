import { FILE_TYPES } from "./Constants";
import { SmileBASICFile } from "./SmileBASICFile";
import { SmileBASICFileType } from "./SmileBASICFileType";
import { SmileBASICMetaContent } from "./SmileBASICMetaContent";

class SmileBASICMetaFile extends SmileBASICFile {
    public Content: SmileBASICMetaContent;

    public constructor() {
        super();
        this.Content = new SmileBASICMetaContent();
    }

    public static async FromFile(input: SmileBASICFile): Promise<SmileBASICMetaFile> {
        if (
            !(input.Header.FileType in FILE_TYPES[ input.Header.Version ]) ||
            (FILE_TYPES[ input.Header.Version ] as any)[ input.Header.FileType ] !== SmileBASICFileType.Meta
        ) {
            throw new Error("File does not have Text file type");
        }

        let file = new SmileBASICMetaFile();
        file.Header = input.Header;
        file.RawContent = input.RawContent;
        file.Footer = input.Footer;

        file.Content = SmileBASICMetaContent.FromBuffer(file.RawContent);

        return file;
    }

    public static async FromBuffer(input: Buffer, verifyFooter: boolean = false): Promise<SmileBASICMetaFile> {
        let file = await super.FromBuffer(input, verifyFooter);
        return this.FromFile(file);
    }

    // TODO: Implement SmileBASICMetaFile#ToBuffer
    public async ToBuffer(): Promise<Buffer> {
        return super.ToBuffer();
    }
}

// We have to do this to prevent circular dependencies, but it's also nice since it decouples the casting.
declare module "./SmileBASICFile" {
    interface SmileBASICFile {
        AsMetaFile(): Promise<SmileBASICMetaFile>;
    }
}

SmileBASICFile.prototype[ "AsMetaFile" ] = async function () {
    return await SmileBASICMetaFile.FromFile(this);
};

export { SmileBASICMetaFile };