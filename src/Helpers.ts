declare global {
    interface Buffer {
        /**
         * Swaps colors to the proper byte order. Does the swap in-place.
         * @returns The original Buffer, with the bytes properly swapped.
         */
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