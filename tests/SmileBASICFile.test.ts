import * as fs from "fs";
import * as path from "path";
import { Header, SmileBASICFile, SmileBASICFileVersion } from "../";

test("create new SmileBASICFile instance", () => {
    let file = new SmileBASICFile();
    expect(file).toBeInstanceOf(SmileBASICFile);
});

let example_binaries = fs.readdirSync(path.join(__dirname, "example_binaries"));
for (let filename of example_binaries) {
    test(`${filename} parses successfully`, async () => {
        let file = await SmileBASICFile.FromBuffer(fs.readFileSync(path.join(__dirname, "example_binaries", filename)));

        expect(file).toBeInstanceOf(SmileBASICFile);

        expect(file.Header).toBeInstanceOf(Header);
        expect(file.RawContent).toBeInstanceOf(Buffer);
        expect(file.Footer).toBeInstanceOf(Buffer);
    });
}
