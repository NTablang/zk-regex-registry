import path from "path"
import fs from "fs";
import { spawn } from "child_process";
import { genCircomAllstr } from '../code-gen/gen_circom';

const CIRCUIT_OUT_DIR = "./output/circuit"
const CODE_OUT_DIR = "./output/code"
const PTAU_PATH = "./ptau/powersOfTau28_hez_final_23.ptau"

export function compileCircuit(circuitSlug: string, circuitName: string, force: boolean): Promise<void> {
    console.log(`Compiling circuit for ${circuitSlug} with name ${circuitName} and force ${force}`);
    // Make sure output directory exists, delete if exist
    const circuitDirectory = path.join(CIRCUIT_OUT_DIR, circuitSlug);
    if (fs.existsSync(circuitDirectory)) {
        if (force) {
            fs.rmSync(circuitDirectory, { recursive: true })
        } else {
            console.log("Skipping compilation")
            return Promise.resolve();
        }
    }
    fs.mkdirSync(circuitDirectory, { recursive: true })
    const circuitPath = path.join(CODE_OUT_DIR, circuitSlug, "circuit", `${circuitName}.circom`)
    return new Promise<void>((resolve, reject) => {
        const c = spawn("circom", [circuitPath , '--r1cs', '--wasm', '-o', circuitDirectory, '-l', './node_modules'])
        c.stdout.on('data', (data) => {
            process.stdout.write(`stdout: ${data}`, );
        });
        c.stderr.on('data', (data) => {
            process.stderr.write(`stdout: ${data}`);
        });
        c.on('exit', (code, signal) => {
            if (code === 0) {
                console.log(`Compiled circuit for ${circuitSlug} with name ${circuitName}`);
                resolve();
            } else {
                console.log(`Process exited with code ${code}`);
                reject();
            }
        });
    });
}

export function generateZKey(circuitSlug: string, circuitName: string, force: boolean): Promise<void> {
    // Make sure output directory exists, delete if exist
    console.log(`Generating zkey for ${circuitSlug} with name ${circuitName}`);
    const zkeyPath = path.join(CIRCUIT_OUT_DIR, circuitSlug, circuitName + '.zkey');
    const zkeyLogPath = path.join(CIRCUIT_OUT_DIR, circuitSlug, circuitName + '_zkey.log');
    if (fs.existsSync(zkeyPath)) {
        if (force) {
            fs.rmSync(zkeyPath);
        } else {
            console.log("Skipping zkey generation")
            return Promise.resolve();
        }
    }

    const r1csPath = path.join(CIRCUIT_OUT_DIR, circuitSlug, circuitName + '.r1cs');
    return new Promise<void>((resolve, reject) => {
        const c = spawn("./node_modules/.bin/snarkjs", ['zkey', 'new', r1csPath, PTAU_PATH, zkeyPath, '-v'], {
            env: {
                ...process.env,
                NODE_OPTIONS: '--max-old-space-size=112000'
            }
        });
        c.stdout.on('data', (data) => {
            fs.writeFile(zkeyLogPath, data, { flag: 'a+' }, () => {})
        });
        c.stderr.on('data', (data) => {
            process.stderr.write(`stdout: ${data}`);
        });
        c.on('exit', (code, signal) => {
            if (code === 0) {
                console.log(`Generated ZKey for ${circuitSlug} with name ${circuitName}`);
                resolve();
            } else {
                console.log(`Process exited with code ${code}`);
                reject();
            }
        });
    });
}

export function generateVKey(circuitSlug: string, circuitName: string, force: boolean): Promise<void> {
    console.log(`Generating vkey for ${circuitSlug} with name ${circuitName}`);
    const vKeyPath = path.join(CIRCUIT_OUT_DIR, circuitSlug, circuitName + '_vkey.json');
    const zkeyPath = path.join(CIRCUIT_OUT_DIR, circuitSlug, circuitName + '.zkey');
    if (fs.existsSync(vKeyPath)) {
        if (force) {
            fs.rmSync(vKeyPath);
        } else {
            console.log("Skipping vkey generation")
            return Promise.resolve();
        }
    }
    // node ../node_modules/.bin/snarkjs zkey export verificationkey "$BUILD_DIR"/"$CIRCUIT_NAME".zkey "$BUILD_DIR"/"$CIRCUIT_NAME"_vkey.json
    return new Promise<void>((resolve, reject) => {
        const c = spawn("./node_modules/.bin/snarkjs", ['zkey', 'export', 'verificationkey', zkeyPath, vKeyPath]);
        c.stdout.on('data', (data) => {
            process.stdout.write(`stdout: ${data}`);
        });
        c.stderr.on('data', (data) => {
            process.stderr.write(`stdout: ${data}`);
        });
        c.on('exit', (code, signal) => {
            if (code === 0) {
                console.log(`Generated VKey for ${circuitSlug} with name ${circuitName}`);
                resolve();
            } else {
                console.log(`Process exited with code ${code}`);
                reject();
            }
        });
    });
}

export function copyGenerateInputScript(circuitSlug: string, circuitName: string, force: boolean): Promise<void> {
    const scriptPath = path.join(CODE_OUT_DIR, circuitSlug, "generate_inputs.js");
    const inputScriptPath = path.join(CIRCUIT_OUT_DIR, circuitSlug, circuitName + "_js", "generate_inputs.js");
    if (fs.existsSync(inputScriptPath)) {
        if (force) {
            fs.rmSync(inputScriptPath);
        } else {
            console.log("Skipping input script generation")
            return Promise.resolve();
        }
    }
    fs.copyFileSync(scriptPath, inputScriptPath);
    return Promise.resolve();  
}