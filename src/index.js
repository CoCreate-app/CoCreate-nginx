const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);
let fs = require('fs');
const os = require('os');

const available = "/etc/nginx/sites-available/"
const enabled = "/etc/nginx/sites-enabled/"
class CoCreateNginx {
    constructor(cluster) {
        if (cluster.worker.id === 1)
            this.init()
    }

    async init() {
        try {
            const platform = os.platform();

            if (platform === 'linux') {
                // For Debian/Ubuntu
                try {
                    await exec('nginx -v');
                    console.log('Nginx is already installed.');
                } catch (error) {
                    console.log('Nginx not found, installing...');
                    await exec('sudo apt-get update && sudo apt-get install -y nginx');
                    await exec("sudo ufw allow 'Nginx Full'");
                    console.log('Nginx installed successfully');
                }

                await exec('sudo chmod 777 /etc/nginx/nginx.conf');

                let stream = `user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 768;
    # multi_accept on;
}

http {
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}

stream {
    server {
        listen 443;
        proxy_pass 127.0.0.1:8443; # Node.js app listening on port 8443
    }
}
`
                // fs.writeFileSync('/etc/nginx/nginx.conf', stream)

                await exec('sudo chmod 777 /etc/nginx/sites-available');
                await exec('sudo chmod 777 /etc/nginx/sites-enabled');
                if (!fs.existsSync(`${enabled}main`)) {
                    let main = `server {
    listen 80;
    listen [::]:80;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        fastcgi_buffers 16 16k;
        fastcgi_buffer_size 32k;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
}
`

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
                    } else {
                        console.log('main test failed')
                    }

                }

            } else if (platform === 'darwin') {
                // TODO: For macOS
                await exec('brew install nginx');
            } else if (platform === 'win32') {
                // TODO: For Windows, assuming Chocolatey is installed
                await exec('choco install nginx');
            } else {
                console.log('Unsupported OS');
            }


        } catch (error) {
            console.error('Failed to Nginx: ', error);
        }
    }

    async createServer(hosts) {
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
            proxy_pass http://localhost:8080;
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
    ssl_certificate /etc/certificates/${host}/fullchain.pem;
    ssl_certificate_key /etc/certificates/${host}/private-key.pem;
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

        return response
    }

    async deleteServer(hosts) {
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

    async hasServer(hosts) {
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

    updateSudoers() {
        const newRules = [
            'appuser ALL=(ALL) NOPASSWD: /bin/ln -s /etc/nginx/sites-available/* /etc/nginx/sites-enabled/*',
            'appuser ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t',
            'appuser ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx',
            // Include any specific command or script you've prepared for safely writing to sites-available
            // 'appuser ALL=(ALL) NOPASSWD: /path/to/your/specific_command_or_script'
        ];

        // Convert array of rules into a single string, each rule separated by a newline
        const rulesStr = newRules.join("\\n");
        const cmd = `echo '${rulesStr}' | sudo EDITOR='tee -a' visudo`;

        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error}`);
                return;
            }
            if (stderr) {
                console.error(`Stderr: ${stderr}`);
                return;
            }
            console.log(`Sudoers updated: ${stdout}`);
        });
    }

}

module.exports = CoCreateNginx