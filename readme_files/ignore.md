```
sudo curl -Lo /usr/local/bin/bazel https://github.com/bazelbuild/bazelisk/releases/download/v1.17.0/bazelisk-linux-amd64
sudo chmod +x /usr/local/bin/bazel
bazel version
git clone https://github.com/tensorflow/tensorflow.git
cd tensorflow
git checkout
./configure
>>> /var/www/miniconda3/envs/condaenv/bin/python
>>> /var/www/miniconda3/envs/condaenv/lib/python3.11/site-packages
>>> N
>>> N
>>> Y
>>> /usr/bin/clang
>>> Enter
>>> N
bazel build --config=dbg //tensorflow/tools/pip_package:build_pip_package --local_ram_resources=2048 --jobs=4
bazel build --config=dbg //tensorflow/tools/pip_package:build_pip_package

#python3 -m pip install tensorflow==2.13.*
#conda install -c conda-forge tensorflow
#pip install torch==1.5.0 -f https://download.pytorch.org/whl/torch_stable.html
#conda install pytorch torchvision torchaudio cpuonly -c pytorch
```