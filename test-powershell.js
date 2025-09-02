const { spawn } = require('child_process');

console.log('Testing PowerShell module...');

const psArgs = ['-Command', `Import-Module 'C:\\Users\\User\\Desktop\\Claude-Agent-Dashboard\\AgentManager.psm1' -Force; Start-ClaudeAgent -ProjectPath 'C:\\Users\\User\\apps\\upify' -AgentCommand '' -AgentName 'TestClaude' -ProjectName 'Upify'`];

console.log('PowerShell args:', psArgs);

const psProcess = spawn('powershell', psArgs);

let stdout = '';
let stderr = '';

psProcess.stdout.on('data', (data) => {
  const output = data.toString();
  stdout += output;
  console.log('STDOUT:', output);
});

psProcess.stderr.on('data', (data) => {
  const output = data.toString();
  stderr += output;
  console.log('STDERR:', output);
});

psProcess.on('close', (code) => {
  console.log('Exit code:', code);
  console.log('Final stdout:', stdout);
  console.log('Final stderr:', stderr);
  
  if (stdout.includes('SUCCESS:') || stderr.includes('SUCCESS:')) {
    console.log('✅ SUCCESS detected!');
  } else {
    console.log('❌ No SUCCESS detected');
  }
});

psProcess.on('error', (error) => {
  console.error('Error:', error);
});