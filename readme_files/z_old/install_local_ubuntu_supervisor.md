## Install framing
- Open Ubuntu.
- Change to administrator mode and update Ubuntu packages.

```
sudo su
apt update
apt-get autoremove
apt-get autoclean
apt install curl git unzip -y
apt-get update && apt-get install -y llvm clang
# Use arrow keys and space bar to select all processes, tab button to 'Ok' and hit enter
sudo apt install python3-dev python3-pip
# >>> Y
```

Choose one of the following:
 - A) Clone the framing GitHub repo.
```bash
git clone https://github.com/iandavis1937/framing
```
- B) Download the framing GitHub repository .zip file to your local computer. Unpack the package. Then use a file manager like [FileZilla](https://filezilla-project.org/download.php?type=client) to move the /framing/ folder your directory of choice.

 ### Install Python Dependencies
-  Install Miniconda to manage Python packages. 
    - Note: there is a yes/no (with default no) after the 'Export;Cryptography' section of the Miniconda user agreement. Press Enter up to this header and then slow down.
    - You will need to choose an installation directory for miniconda3. The default is fine, just record it in case you need to add Miniconda to the path.
    - Additionally, framing was written to be used with Python 3.11.

```bash 
wget https://repo.anaconda.com/miniconda/Miniconda3-py311_23.11.2-0-Linux-x86_64.sh
bash Miniconda3-py311_23.11.2-0-Linux-x86_64.sh
# >>> yes
# >>> /home/<username>/miniconda3/   # This is an example, choose what is easiest for your system
# >>> yes
export PATH="/home/<username>/miniconda3/bin:$PATH"    # Again, change to match install directory
conda --version
conda update conda
# >>> y
```
- Create a conda environment for managing Python packages.
```bash
conda init bash
conda create --name <name of conda env> -c conda-forge python=3.11
# >>> y

# Ex.
conda init bash
conda create --name condaenv -c conda-forge python=3.11
# >>> y
```
- Restart your terminal and activate the conda environment.
```bash
conda activate <name of conda env>
~/miniconda3/envs/<env_name>/bin/python --version
~/miniconda3/envs/<env_name>/bin/pip --version
conda install pip   # Update pip if needed

# Ex.
sudo su
conda activate condaenv
~/miniconda3/envs/condaenv/bin/python --version
~/miniconda3/envs/condaenv/bin/pip --version
conda install pip   # Update pip if needed
```
 
- Navigate to /py/
```bash
cd <path>/framing/py
```
- Install PyTorch and related dependencies. 
	- Note: this is a large package which, during framing's development, has crashed EC2 servers during installation. The present tutorial's instructions for installing PyTorch have been carefully optimized for a low-memory AWS EC2 instance.
```bash
conda install numpy wheel packaging requests opt_einsum
conda install keras-preprocessing
conda install nltk pydantic jinja2 setuptools packaging
export TF_PYTHON_VERSION=3.11
conda install cmake ninja mkl mkl-include
conda install pytorch torchvision torchaudio cpuonly -c pytorch
conda install tokenizers transformers protobuf sentencepiece numpy requests pydantic jinja2 setuptools
conda install pyzmq nltk inflect spacy
~/miniconda3/envs/<env_name>/bin/pip install benepar    # Ex. ~/miniconda3/envs/condaenv/bin/pip install benepar
~/miniconda3/envs/<env_name>/bin/python -m spacy download en_core_web_sm     # Ex. ~/miniconda3/envs/condaenv/bin/python
```
### (Optional for Local Use) Install a Task Manager to Run the Python Script
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
command=/<your>/<path>/miniconda3/envs/<env_name>/bin/python /<your>/<path>/framing/py/app_7_24.py
autostart=true
autorestart=true
stderr_logfile=/<your>/<path>/app_7_24.err.log
stdout_logfile=/<your>/<path>/app_7_24.out.log

# Ex. .conf file:
[program:app_7_24] 
command=/home/miniconda3/envs/condaenv/bin/python /mnt/c/wd/framing/py/app_7_24.py
autostart=true
autorestart=true
stderr_logfile=/mnt/c/wd/framing/py/log/app_7_24.err.log
stdout_logfile=/mnt/c/wd/framing/py/log/app_7_24.out.log
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
