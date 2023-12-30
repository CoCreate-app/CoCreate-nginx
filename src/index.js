const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);
let fs = require('fs');
const os = require('os');

const available = "/etc/nginx/sites-available/"
const enabled = "/etc/nginx/sites-enabled/"

async function createServer(hosts) {
    const response = {}
    if (!Array.isArray(hosts))
        hosts = [hosts]

    for (let host of hosts) {
        const hostParts = host.split('.')
        const domain = hostParts[0];
        const tld = hostParts[1];
        const server = `
server {
    server_name  ~^(?<sub>.+)\.${domain}\.${tld} ${host};
  
    location / {
            proxy_pass http://localhost:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";

            fastcgi_buffers 16 16k;
            fastcgi_buffer_size 32k;
            proxy_buffer_size 128k;
            proxy_buffers 4 256k;
            proxy_busy_buffers_size 256k;

    }

    listen 443 ssl http2;
    ssl_certificate /home/ubuntu/CoCreateWS/certificates/${host}/fullchain.pem;
    ssl_certificate_key /home/ubuntu/CoCreateWS/certificates/${host}/privkey.pem;
  
}

`;

        fs.writeFileSync(`${available}${host}`, server)

        if (!fs.existsSync(`${enabled}${host}`))
            await exec(`sudo ln -s ${available}${host} ${enabled}`);

        let test = await exec(`sudo nginx -t`);
        if (test.stderr.includes('test is successful')) {
            await exec(`sudo systemctl reload nginx`);
            console.log(host, 'test passed reloading nginx')
            response[host] = true
        } else {
            console.log(host, 'test failed')
            response[host] = false
        }
    }


    if (!fs.existsSync(`${enabled}main`)) {
        let main = `server {
            listen 80 default_server;
            listen [::]:80 default_server;
        
        
            server_name _;
            return 301 https://$host$request_uri;
        }`

        fs.writeFileSync(`${available}main`, main)
        await exec(`sudo ln -s ${available}main ${enabled}`);

        if (fs.existsSync(`${enabled}default`))
            fs.unlinkSync(`${enabled}default`)
        if (fs.existsSync(`${available}default`))
            fs.unlinkSync(`${available}default`)

        let test = await exec(`sudo nginx -t`);
        if (test.stderr.includes('test is successful')) {
            await exec(`sudo systemctl reload nginx`);
            console.log('main test passed reloading nginx')
            response['main'] = true
        } else {
            console.log('main test failed')
            response['main'] = false
        }

    }

    return response
}

async function deleteServer(hosts) {
    const response = {}
    if (!Array.isArray(hosts))
        hosts = [hosts]
    for (let host of hosts) {
        if (fs.existsSync(`${enabled}${host}`))
            fs.unlinkSync(`${enabled}${host}`)
        if (fs.existsSync(`${available}${host}`))
            fs.unlinkSync(`${available}${host}`)

        response[host] = true
    }
    return response
}

async function hasServer(hosts) {
    if (!Array.isArray(hosts))
        hosts = [hosts]
    for (let host of hosts) {
        const { stdout, stderr } = await exec(`grep -Ri 'server_name.*${host}' /etc/nginx/sites-enabled`)
        if (stderr) {
            console.error(`exec error: ${err}`);
            return;
        }
        if (stdout) {
            console.log(`Host found in the following configuration file(s):\n${stdout}`);

        } else {
            console.log('Host not found in Nginx configurations.');
        }

        if (stderr) console.error(`stderr: ${stderr}`);

    }
}

async function installNginx() {
    try {
        const platform = os.platform();

        if (platform === 'linux') {
            // For Debian/Ubuntu
            await exec('sudo apt-get update && sudo apt-get install -y nginx');
            await exec('sudo chmod 775 /etc/nginx/sites-available');
        } else if (platform === 'darwin') {
            // TODO: For macOS
            await exec('brew install nginx');
        } else if (platform === 'win32') {
            // TODO: For Windows, assuming Chocolatey is installed
            await exec('choco install nginx');
        } else {
            console.log('Unsupported OS');
        }

        await exec("sudo ufw allow 'Nginx Full'");
        await exec('sudo chmod 777 /etc/nginx/sites-available');

        console.log('Nginx installed successfully');
        createServer('cocreate.site')

    } catch (error) {
        console.error('Failed to Nginx:', error);
    }
}

function init() {
    exec('nginx -v', (error) => {
        if (error) {
            console.log('Nginx not found, installing...');
            installNginx();
        } else {
            console.log('Nginx is already installed.');
        }
    });
}

init();

process.on('certificateCreated', (host) => {
    createServer(host)
});

module.exports = { createServer, hasServer, deleteServer }