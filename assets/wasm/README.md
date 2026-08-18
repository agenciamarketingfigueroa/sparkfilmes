# Spark Processor WASM

Pequeno núcleo de processamento local do editor, sem imports. O JavaScript
instancia `spark-processor.wasm`, acessa os buffers pela `memory` exportada e
expande a memória antes de masterizar a trilha completa.

## ABI

| Export | Assinatura | Resultado |
| --- | --- | --- |
| `current_buffer()` | `() -> i32` | Ponteiro para até `96 * 128` bytes de luminância (`Uint8Array`). |
| `previous_buffer()` | `() -> i32` | Ponteiro para o quadro anterior, com a mesma capacidade. |
| `audio_buffer()` | `() -> i32` | Ponteiro inicial da região expansível de amostras mono `Float32`. |
| `exposure(len)` | `(i32) -> i32` | Luminância média Q8.8 (`valor / 256`, de 0 a 255). |
| `sharpness(w, h)` | `(i32, i32) -> i32` | Média absoluta do Laplaciano Q8.8 (`valor / 256`). |
| `best_shift(w, h, radius)` | `(i32, i32, i32) -> i32` | `dx` `int16` nos 16 bits altos e `dy` `int16` nos baixos. O raio é limitado a 8. |
| `shift_error()` | `() -> i32` | RMS normalizado do último alinhamento em Q16.16 (`valor / 65536`). |
| `commit_frame(len)` | `(i32) -> i32` | Copia o quadro atual para o anterior e retorna os bytes copiados. |
| `master_audio(count, target_peak)` | `(i32, f32) -> f32` | Normaliza/limita a faixa completa no próprio buffer e retorna o ganho aplicado. `target_peak` é `float32` de 0 a 1. |

Para decodificar o deslocamento em JavaScript:

```js
const packed = wasm.best_shift(width, height, radius);
const dx = packed >> 16;
const dy = (packed << 16) >> 16;
```

Compilação reproduzível com Deno e WABT:

```sh
deno run --allow-read --allow-write=assets/wasm assets/wasm/build.js
```

Validação isolada:

```sh
deno test --allow-read tests/wasm-processor.test.js
```
