import { FILE_TYPES } from "./Constants";
import { SmileBASICFile } from "./SmileBASICFile";
import { SmileBASICFileType } from "./SmileBASICFileType";

class SmileBASICTextFile extends SmileBASICFile {
    public Content: string;

    public constructor() {
        super();
        this.Content = "";
    }

    public static async FromFile(input: SmileBASICFile): Promise<SmileBASICTextFile> {
        if (
            !(input.Header.FileType in FILE_TYPES[ input.Header.Version ]) ||
            (FILE_TYPES[ input.Header.Version ] as any)[ input.Header.FileType ] !== SmileBASICFileType.Text
        ) {
            throw new Error("File does not have Text file type");
        }

        let file = new SmileBASICTextFile();
        file.Header = input.Header;
        file.RawContent = input.RawContent;
        file.Footer = input.Footer;

        file.Content = file.RawContent.toString("utf8");

        return file;
    }

    public static async FromBuffer(input: Buffer, verifyFooter: boolean = false): Promise<SmileBASICTextFile> {
        let file = await super.FromBuffer(input, verifyFooter);

        return this.FromFile(file);
    }

    public async ToBuffer(): Promise<Buffer> {
        this.RawContent = Buffer.from(this.Content, "ucs2");
        return super.ToBuffer();
    }
}

// We have to do this to prevent circular dependencies, but it's also nice since it decouples the casting.
declare module "./SmileBASICFile" {
    interface SmileBASICFile {
        AsTextFile(): Promise<SmileBASICTextFile>;
    }
}

SmileBASICFile.prototype[ "AsTextFile" ] = async function () {
    return await SmileBASICTextFile.FromFile(this);
};

SmileBASICFile.FileTypeMappings.set(SmileBASICFileType.Text, SmileBASICTextFile);


export { SmileBASICTextFile };