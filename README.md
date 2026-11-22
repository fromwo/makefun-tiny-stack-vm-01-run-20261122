# Tiny Stack VM

A tiny stack virtual machine implementing ISA v1 for make.fun's
"Build a tiny stack virtual machine, 22 November 2026" bounty.

## What it does

For every instance directory `<id>` under the input directory, it runs
`<id>/program.bin` with `<id>/input.bin` as input and writes
`<id>/stdout.bin` (the exact bytes the program wrote) and `<id>/exit.txt`
(the exit code, 0-255) under the output directory.

The VM has 32-bit wrapping integers, a 256-value data stack, a 64-entry
call stack, 256 words of memory, and the ISA v1 traps (stack under/overflow,
division by zero, unknown opcode, bad memory address, call stack
over/underflow, pc out of range, step limit, output limit), each with its
own exit code. Output written before a trap is kept.

## Run

```sh
node main.ts
```

Input and output directories come from `MAKEFUN_INPUT_DIR` (default
`/input`) and `MAKEFUN_OUTPUT_DIR` (default `/output`). The whole set of
40 practice instances runs in well under 60 seconds and is deterministic:
two runs produce byte-identical output.

## Files

- `main.ts` — the VM entry point (plain JavaScript, no dependencies)
- `LICENSE` — MIT license
- `.makefun/owner.json` — the entrant's wallet

## License

MIT. See `LICENSE`.
