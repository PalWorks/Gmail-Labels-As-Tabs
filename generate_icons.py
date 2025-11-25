
import os
import struct
import zlib

def generate_png(width, height, color, filename):
    # Simple PNG generator (uncompressed truecolor)
    # Signature
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR
    ihdr = struct.pack('!I4sIIBBBBB', 13, b'IHDR', width, height, 8, 2, 0, 0, 0)
    ihdr += struct.pack('!I', zlib.crc32(ihdr[4:]))
    png += ihdr
    
    # IDAT
    # 3 bytes per pixel (RGB)
    raw_data = b''
    for _ in range(height):
        raw_data += b'\x00' # Filter type 0 (None)
        raw_data += color * width
        
    compressed = zlib.compress(raw_data)
    idat = struct.pack('!I4s', len(compressed), b'IDAT') + compressed
    idat += struct.pack('!I', zlib.crc32(idat[4:]))
    png += idat
    
    # IEND
    iend = struct.pack('!I4s', 0, b'IEND')
    iend += struct.pack('!I', zlib.crc32(iend[4:]))
    png += iend
    
    with open(filename, 'wb') as f:
        f.write(png)

# Blue color (RGB)
blue = b'\x42\x85\xF4'

generate_png(16, 16, blue, 'src/icons/icon16.png')
generate_png(48, 48, blue, 'src/icons/icon48.png')
generate_png(128, 128, blue, 'src/icons/icon128.png')
print("Icons generated.")
