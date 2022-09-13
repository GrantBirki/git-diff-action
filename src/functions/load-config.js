import yaml from 'js-yaml';
import fs from 'fs';
import * as core from '@actions/core'

var configPath

// Helper function to load the config file
// :returns: The config object which is parsed yaml
// If an error occurs, setFailed is called and it returns null
export function loadConfig() {
    try {
        configPath = core.getInput('config')
        const config = yaml.load(fs.readFileSync(configPath));
        return config;
    } catch (e) {
        if (e.code === 'ENOENT') {
            core.setFailed(
                `Config file not found! Check your 'config' path input - ${configPath}`
            )
        } else {
            core.setFailed(`Error loading config file: ${e}`)
        }
    }
}


