import { FILE_TYPES } from "./Constants";
import { SmileBASICFile } from "./SmileBASICFile";
import { SmileBASICFileType } from "./SmileBASICFileType";

class SmileBASICTextFile extends SmileBASICFile {
    public Content: string;

    public constructor() {
        super();
        this.Content = "";
    }

    public static FromFile(input: SmileBASICFile): SmileBASICTextFile {
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

        file.Content = file.RawContent.toString("ucs2");

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

export { SmileBASICTextFile };