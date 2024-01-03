const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);
let fs = require('fs');
const os = require('os');

const conf = "/etc/nginx/nginx.conf"
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

                let stream = `user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 768;
    # multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    ssl_protocols TLSv1.2 TLSv1.3;  
    ssl_ciphers 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    ssl_stapling on;
    ssl_stapling_verify on;
    # resolver [YOUR_DNS_RESOLVER_IP] valid=300s;  # Replace with your DNS resolver IP
    resolver_timeout 5s;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    # add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none'";

    server_tokens off;

    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    gzip on;
    gzip_disable "msie6";

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}

stream {
    map $ssl_preread_server_name $upstream {
        default nodejs_ssl;
    }

    server {
        listen 443;
        proxy_pass $upstream;
        ssl_preread on;
    }

    upstream nginx_ssl {
        server 127.0.0.1:12345;  # Nginx handles SSL
    }

    upstream nodejs_ssl {
        server 127.0.0.1:8443;  # Node.js SSL
    }
}
`
                await exec(`sudo chmod 777 ${conf}`);
                fs.writeFileSync(conf, stream)

                await exec(`sudo chmod 777 ${available}`);
                await exec(`sudo chmod 777 ${enabled}`);
                let main = `server {
    listen 80;
    listen [::]:80;

    location /.well-known/acme-challenge/ {
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

    location / {
        return 301 https://$host$request_uri;
    }
}
`
                if (fs.existsSync(`${enabled}main.txt`))
                    fs.writeFileSync(`${available}main.txt`, main)
                else {
                    fs.writeFileSync(`${available}main.txt`, main)
                    await exec(`sudo ln -s ${available}main.txt ${enabled}`);
                }
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
            const stream = fs.readFileSync(conf, 'utf8');
            const modifiedStream = stream.replace('default nodejs_ssl;', `\t\t${host} nginx_ssl;\ndefault nodejs_ssl;`);
            fs.writeFileSync(conf, modifiedStream);

            const server = `
server {
    listen 12345 ssl http2;
    server_name ~^(?<sub>.+)\.${domain}\.${tld} ${host};
  
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

    ssl_certificate /etc/certificates/${host}/fullchain.pem;  # Adjust to your certificate path
    ssl_certificate_key /etc/certificates/${host}/private-key.pem;  # Adjust to your key path

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