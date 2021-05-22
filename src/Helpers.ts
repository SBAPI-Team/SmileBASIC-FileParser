declare global {
    interface Buffer {
        swapColors(): Buffer;
    }
}

Buffer.prototype.swapColors = function () {
    for (let i = 0; i < this.length; i += 4) {
        [ this[ i + 0 ], this[ i + 2 ] ] = [ this[ i + 2 ], this[ i + 0 ] ];
    }
    return this;
};

export { };