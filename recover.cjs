const fs = require('fs');
const readline = require('readline');

async function recoverFile() {
    const fileStream = fs.createReadStream('C:\\Users\\Adrian Magante\\.gemini\\antigravity-ide\\brain\\d3d91027-ebd3-48b8-9f12-65df08ef3bfe\\.system_generated\\logs\\transcript_full.jsonl');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let writes = [];

    for await (const line of rl) {
        try {
            const data = JSON.parse(line);
            if (data.type === 'PLANNER_RESPONSE' && data.tool_calls) {
                for (const call of data.tool_calls) {
                    if (call.name === 'default_api:write_to_file' || call.name === 'default_api:replace_file_content' || call.name === 'default_api:multi_replace_file_content') {
                        const args = call.arguments;
                        if (args && (args.TargetFile || args.AbsolutePath) && typeof args.TargetFile === 'string' && args.TargetFile.includes('ManageAccounts.vue')) {
                            writes.push(call);
                        }
                    }
                }
            }
        } catch (e) {}
    }
    fs.writeFileSync('ManageAccounts_history.json', JSON.stringify(writes, null, 2));
    console.log(`Found ${writes.length} writes to ManageAccounts.vue`);
}

recoverFile();
