import { Header } from "./Header";
import { inflate, deflate } from "zlib";
import { promisify } from "util";
import { FILE_HEADER_SIZE, FILE_OFFSETS, HMAC_KEY } from "./Constants";
import { createHmac } from "crypto";

// Promisify these guys so we aren't using callbacks
const inflateAsync = promisify(inflate);
const deflateAsync = promisify(deflate);

class SmileBASICFile {
    public Header: Header;
    public RawContent: Buffer;
    public Footer: Buffer;

    public constructor() {
        this.Header = new Header();
        this.RawContent = Buffer.alloc(0);
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

        let content = Buffer.alloc(input.length - headerSize - FILE_OFFSETS[ "FOOTER_SIZE" ]);
        input.copy(content, 0, headerSize);

        if (header.IsCompressed) {
            content = await inflateAsync(content);
        }

        let footer = Buffer.alloc(FILE_OFFSETS[ "FOOTER_SIZE" ]);
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