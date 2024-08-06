const { spawn } = require('child_process');
const path = require('path');

async function transcribeAudio(audioPath) {
    return new Promise((resolve, reject) => {
        const posixPath = path.posix.join(...audioPath.split(path.sep));

        const whisperProcess = spawn('whisper', [posixPath]);

        let transcription = '';
        whisperProcess.stdout.on('data', (data) => {
            transcription += data.toString();
        });

        whisperProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        whisperProcess.on('close', (code) => {
            if (code === 0) {
                resolve(transcription);
            } else {
                reject(new Error(`Whisper process exited with code ${code}`));
            }
        });
    });
}
module.exports = { transcribeAudio };
