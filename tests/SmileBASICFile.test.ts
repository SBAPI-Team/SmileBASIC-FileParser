import * as fs from "fs";
import * as path from "path";
import { Header, SmileBASICFile } from "../src";

test("creating new SmileBASICFile instance works", () => {
    let file = new SmileBASICFile();
    expect(file).toBeInstanceOf(SmileBASICFile);
});

test("SmileBASICFile#ToBuffer works", async () => {
    let file = new SmileBASICFile();
    file.RawContent = Buffer.from("Test\n", "ascii");

    let result = await file.ToBuffer();
    expect(result).toBeInstanceOf(Buffer);
});

test("parsing file made by SmileBASICFile#ToBuffer works", async () => {
    let file = new SmileBASICFile();
    file.RawContent = Buffer.from("Test\n", "ascii");

    let result = await file.ToBuffer();
    let newFile = await SmileBASICFile.FromBuffer(result);

    expect(newFile).toBeInstanceOf(SmileBASICFile);
    expect(newFile.RawContent.toString("ascii")).toBe("Test\n");
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
    test(`${filename} parses successfully with footer verification`, async () => {
        let file = await SmileBASICFile.FromBuffer(
            fs.readFileSync(path.join(__dirname, "example_binaries", filename)),
            true);

        expect(file).toBeInstanceOf(SmileBASICFile);

        expect(file.Header).toBeInstanceOf(Header);
        expect(file.RawContent).toBeInstanceOf(Buffer);
        expect(file.Footer).toBeInstanceOf(Buffer);
    });
    test(`${filename} ToBuffer is parsable and passes footer verification`, async () => {
        let file = await SmileBASICFile.FromBuffer(fs.readFileSync(path.join(__dirname, "example_binaries", filename)));
        let buffer = await file.ToBuffer();

        expect(buffer).toBeInstanceOf(Buffer);
        let newFile = await SmileBASICFile.FromBuffer(buffer);

        expect(newFile).toBeInstanceOf(SmileBASICFile);
        expect(newFile.RawContent.equals(file.RawContent)).toBeTruthy();
    });
}
