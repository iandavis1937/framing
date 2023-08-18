## Install framing
### Connect
- Open Ubuntu.
- Copy your key pair to the .ssh directory.
```
cp ~/<file>/<path>/<key pair file name> ~/.ssh/

# Ex. 1
cp ~/Downloads/mykey.pem ~/.ssh/

# Ex. 2 (Windows directory):
cp /mnt/c/Doc_Test1.pem ~/.ssh/

# Note, helpful ChatGPT question:
# "In Ubuntu, what is the <insert the directory you downloaded the key pair to>?"
```
- Restrict read/write/edit permissions to your key pair.
```
chmod 600 ~/.ssh/<key pair file name>

# Ex. 
chmod 600 ~/.ssh/Doc_Test1.pem
```  
- Change your directory to '~.ssh'
```
cd ~/.ssh/
```
- Connect to your instance via ssh. If in doubt, the command below can also be found on your EC2 dashboard (select the EC2 instance, click 'Connect', and then select 'SSH client').
```
ssh -i "<your key pair file name>" ubuntu@ec2-<your-ip-address-separated-by-dashes>.compute-1.amazonaws.com
# Ex.
ssh -i "Cohen_Lab_Test.pem" ubuntu@ec2-3-218-112-85.compute-1.amazonaws.com
```
- Change to administrator mode and update Ubuntu packages.

```
sudo su
apt update
apt-get autoremove
apt-get autoclean
```
### Installation
- Install the Apache web framework.
```
apt-get install apache2
# >>> Y
apt update
systemctl status apache2
``` 
- Navigate to inside the web framework directory.
```
cd /var/www/
```
Choose one of the following:
 - A) Clone the framing GitHub repo.
```bash
git clone https://github.com/iandavis1937/framing
```
- B) Download the framing GitHub repository .zip file to your local computer. Unpack the package. Then use a file manager like [FileZilla](https://filezilla-project.org/download.php?type=client) to move the /framing/ folder to the /var/www/ folder.

 ### Python Dependencies
-  Install Miniconda to manage Python packages. Note: there is a yes/no (with default no) after the 'Export;Cryptography' section of the Miniconda user agreement. Press Enter up to this header and then slow down.

```bash 
# On AWS EC2 with Apache, framing should be installed in /var/www/ 

wget https://repo.anaconda.com/miniconda/Miniconda3-py311_23.5.2-0-Linux-x86_64.sh
bash Miniconda3-py311_23.5.2-0-Linux-x86_64.sh
# >>> yes
# >>> /var/www/miniconda3
# >>> yes
export PATH="/var/www/miniconda3/bin:$PATH"
conda --version
conda update conda
# >>> y
```
- Create a conda environment for managing Python packages.
```bash
conda create --name <name of conda env> python
# >>> y
conda init bash

# Ex.
conda create --name condaenv python
# >>> y
conda init bash
```
- Exit your connection to the server and restart Ubuntu for the changes to take effect.
```bash
exit
exit
```
- Reconnect and activate the conda environment.
```bash
cd ~/.ssh/
ssh -i "Cohen_Lab_Test.pem" ubuntu@ec2-3-218-112-85.compute-1.amazonaws.com
```
```bash
sudo su
conda activate <name of conda env>
python3 --version
pip3 --version

# Ex.
sudo su
conda activate condaenv
python3 --version
pip3 --version
```
 
- Navigate to /py/
```bash
cd /var/www/framing/py
```
- Install PyTorch. 
	- Note: this is a large package which, during framing's development, has crashed the server during installation. The present tutorial's instructions for installing PyTorch have been carefully optimized for a low-memory AWS EC2 instance.
```bash
sudo apt install curl git unzip -y
sudo apt-get update && sudo apt-get install -y llvm clang
# Use arrow keys and space bar to select all processes, tab button to 'Ok' and hit enter
sudo apt install python3-dev python3-pip
# >>> Y
# Use arrow keys and space bar to select all processes, tab button to 'Ok' and hit enter
pip3 install --upgrade pip
pip3 install -U --user pip numpy wheel packaging requests opt_einsum
pip3 install -U --user keras_preprocessing --no-deps
pip3 install nltk pydantic jinja2 setuptools packaging
export TF_PYTHON_VERSION=3.11
conda install cmake ninja mkl mkl-include
# >>> y
apt-get update
apt-get autoremove
apt-get autoclean
conda install pytorch torchvision torchaudio cpuonly -c pytorch
# >>> y
```
- Install the remaining required Python packages (note: these may take a minute).
```bash
pip3 install torch-struct tokenizers transformers protobuf sentencepiece numpy requests pydantic jinja2 setuptools
pip3 install zmq nltk inflect spacy
pip3 install benepar
python3 -m spacy download en_core_web_sm
```

- Install Supervisor for the Python script. Launching the Python script with Python will keep the Python process alive even if the terminal is closed/goes stale/etc. Feel free to use an alternative process manager. 

```bash   
sudo apt-get install supervisor  
```  
 	
- Create a configuration file. Read these steps:
    - Enter the first command. 
    - Edit the directories to your conda environment, Python script, and logs in the second block before pasting the whole second block into the 'app_7_24.conf' file you opened with the first command.
    - Save (keypress to save and exit is :wq).

```
 sudo vim /etc/supervisor/conf.d/app_7_24.conf
```

```bash
[program:app_7_24]
command=/<your>/<path>/framing/py/miniconda3/envs/condaenv/bin/python /<your>/<path>/framing/py/app_7_24.py
autostart=true
autorestart=true
stderr_logfile=/<your>/<path>/app_7_24.err.log
stdout_logfile=/<your>/<path>/app_7_24.out.log

# Ex. AWS EC2 Apache .conf file:
[program:app_7_24] 
command=/var/www/miniconda3/envs/condaenv/bin/python /var/www/framing/py/app_7_24.py
autostart=true
autorestart=true
stderr_logfile=/var/log/app_7_24.err.log
stdout_logfile=/var/log/app_7_24.out.log
```
- Load the configuration file.
```bash
sudo supervisorctl reread
sudo supervisorctl reload  
```
- Check the package configuration by launching the Python script and looking at the error log, followed by the output log.
```bash
sudo supervisorctl status
sudo tail -f /var/log/app_7_24.err.log    

# If the script is not already running
sudo supervisorctl start app_7_24
sudo tail -f /var/log/app_7_24.err.log    
```	
 
- Monitor via logs and status.
```
# Regular output
sudo tail -f /var/log/app_7_24.out.log
# Error log
sudo tail -f /var/log/app_7_24.err.log
# Status
sudo supervisorctl status
```
- For whenever you have finished your task and want to quit:
```
sudo supervisorctl stop app_7_24
```
### JS Dependencies 
- Navigate to /js/
```
cd ./framing/js
```
- Delete any outdated version of Node (JS) and then install the latest version.

```
apt-get purge nodejs
rm -f /etc/apt/sources.list.d/nodesource.list
apt-get autoremove
apt-get autoclean
apt-get update
curl -sL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
apt-get install -y nodejs
node -v
```

 - If not already installed, install PM2 now.
 ```
 npm install pm2@latest -g
 ```
 - Navigate to framing/js/. Install the required dependencies.
```
npm install
```
- Check the package configuration by launching the JS script and looking at the log.
 ```
 pm2 start js8_2.2.js
 pm2 logs js8_2.2.2.js
 ```

### Using the Python Script:
-- Launch -- 
```bash
sudo supervisorctl start app_7_24
```
-- Monitor via logs and status -- 
```bash
# Regular output
sudo tail -f /var/log/app_7_24.out.log

# Error log
sudo tail -f /var/log/app_7_24.err.log

# Status
sudo supervisorctl status
```
-- Quit -- 
```bash
sudo supervisorctl stop app_7_24
```
 
### Using the JS script:
-- Launch -- 
 ```bash
 pm2 start js8_2.2.js
 ```
-- Monitor via logs and process status -- 
```
# Logs
pm2 logs js8_2.2.2.js

# Process status
pm2 list

# Clear logs
pm2 flush
```
-- Quit -- 
```
pm2 stop all
```
