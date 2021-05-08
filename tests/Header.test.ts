import * as fs from "fs";
import * as path from "path";
import { Header } from "../src";

test("create new Header instance", () => {
    let header = new Header();
    expect(header).toBeInstanceOf(Header);
});

let example_binaries = fs.readdirSync(path.join(__dirname, "example_binaries"));
for (let filename of example_binaries) {
    test(`${filename} header parses successfully`, async () => {
        let header = await Header.FromBuffer(fs.readFileSync(path.join(__dirname, "example_binaries", filename)));
        expect(header).toBeInstanceOf(Header);
    });
}
