import { Header } from "./Header";
import { inflate, deflate } from "zlib";
import { promisify } from "util";
import { FILE_HEADER_SIZE, FILE_OFFSETS, FILE_TYPES, HMAC_KEY } from "./Constants";
import { createHmac } from "crypto";
import { SmileBASICFileType } from "./SmileBASICFileType";

// Promisify these guys so we aren't using callbacks
const inflateAsync = promisify(inflate);
const deflateAsync = promisify(deflate);

class SmileBASICFile {
    public Header: Header;
    public RawContent: Buffer;
    public Footer: Buffer;

    public get Type(): SmileBASICFileType | null {
        if (!(this.Header.FileType in FILE_TYPES[ this.Header.Version ])) {
            return null;
        } else {
            return FILE_TYPES[ this.Header.Version ][ this.Header.FileType as keyof typeof FILE_TYPES[ keyof typeof FILE_TYPES ] ];
        }
    }

    public constructor() {
        this.Header = new Header();

        // What's the difference between Buffer.alloc and Buffer.allocUnsafe?
        // alloc will initialize the memory (by default to all 0's), while allocUnsafe will not
        // Thus, allocUnsafe is faster and doesn't require as much work.
        // We try to use allocUnsafe for the majority of cases, mostly because we're copying around data into a lot of these buffers that is just going to overwrite the initialized buffer.
        // As well, when building files, we're really just going to be overwriting the memory anyways
        this.RawContent = Buffer.allocUnsafe(0);
        this.Footer = Buffer.alloc(20);
    }

    public static VerifyFooter(input: Buffer): boolean {
        let hmacInstance = createHmac("sha1", HMAC_KEY);
        hmacInstance.update(input.slice(0, input.length - FILE_OFFSETS[ "FOOTER_SIZE" ]));

        let calculatedHash = hmacInstance.digest();
        let footer = input.slice(input.length - FILE_OFFSETS[ "FOOTER_SIZE" ]);
        return calculatedHash.equals(footer);
    }

    public static async FromBuffer(input: Buffer, verifyFooter: boolean = false): Promise<SmileBASICFile> {
        if (verifyFooter && !this.VerifyFooter(input)) {
            throw new Error("File footer is invalid!");
        }

        let output = new SmileBASICFile();

        let header = Header.FromBuffer(input);
        let headerSize = FILE_HEADER_SIZE[ header.Version ];

        let content = Buffer.allocUnsafe(input.length - headerSize - FILE_OFFSETS[ "FOOTER_SIZE" ]);
        input.copy(content, 0, headerSize);

        if (header.IsCompressed) {
            content = await inflateAsync(content);
        }

        let footer = Buffer.allocUnsafe(FILE_OFFSETS[ "FOOTER_SIZE" ]);
        input.copy(footer, 0, input.length - FILE_OFFSETS[ "FOOTER_SIZE" ]);

        output.Header = header;
        output.RawContent = content;
        output.Footer = footer;

        return output;
    }

    public async ToBuffer(): Promise<Buffer> {
        this.CalculateFooter();

        let header = this.Header.ToBuffer();
        let content = this.RawContent;
        if (this.Header.IsCompressed) {
            content = await this.GetCompressedContent();
        }
        let footer = this.Footer;

        return Buffer.concat([ header, content, footer ]);
    }

    public async GetCompressedContent(): Promise<Buffer> {
        return await deflateAsync(this.RawContent);
    }

    public async CalculateFooter() {
        let header = this.Header.ToBuffer();

        let content = this.RawContent;
        if (this.Header.IsCompressed) {
            content = await this.GetCompressedContent();
        }

        let fullFile = Buffer.concat([ header, content ]);

        let hmacInstance = createHmac("sha1", HMAC_KEY);
        hmacInstance.update(fullFile);

        this.Footer = hmacInstance.digest();
    }
}

export { SmileBASICFile };