import wabtInit from "npm:wabt@1.0.37";

const directory = new URL("./", import.meta.url);
const sourceUrl = new URL("spark-processor.wat", directory);
const outputUrl = new URL("spark-processor.wasm", directory);
const wabt = await wabtInit();
const source = await Deno.readTextFile(sourceUrl);
const module = wabt.parseWat(sourceUrl.pathname, source, {
  bulk_memory: true,
  mutable_globals: true,
  sign_extension: true,
  sat_float_to_int: true,
});

try {
  module.resolveNames();
  module.validate();
  const { buffer } = module.toBinary({
    canonicalize_lebs: true,
    relocatable: false,
    write_debug_names: false,
  });
  await Deno.writeFile(outputUrl, buffer);
  console.log(`WASM gerado: ${buffer.byteLength} bytes`);
} finally {
  module.destroy();
}
