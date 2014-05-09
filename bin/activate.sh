#!/bin/bash

# TODO: Relocate into helper module.
# @credit http://stackoverflow.com/a/246128/330439
SOURCE="${BASH_SOURCE[0]:-$0}"
while [ -h "$SOURCE" ]; do
  DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
done
BASE_PATH="$( cd -P "$( dirname "$SOURCE" )" && pwd )"



# TODO: Relocate this into dedicated service.

echo "[pio] Switching environment ..."
# TODO: Make all this configurable

. $BASE_PATH/../../$(basename $(dirname $BASE_PATH)).activate.sh

export PATH=$BASE_PATH:$PATH

# TODO: Relocate into plugin.
alias snap='osascript $BASE_PATH/../services/devcomp/io.devcomp.osx/scripts/LaunchSnapzProX.scpt'
# TODO: Add watch process that will upload screenshot once saved.


# @see https://github.com/creationix/nvm
if hash nvm 2>/dev/null; then
	echo "" > /dev/null
else
	curl https://raw.githubusercontent.com/creationix/nvm/v0.6.1/install.sh | sh
fi
. $HOME/.profile
nvm use 0.10
which node
node -v
which npm
npm -v

# @see http://www.cyberciti.biz/tips/howto-linux-unix-bash-shell-setup-prompt.html
# @see http://www.tldp.org/HOWTO/Bash-Prompt-HOWTO/x329.html
PS1="\[\033[1;34m\]\[\033[47m\](OS)\[\033[0m\] \[\033[1;35m\]$(basename $(dirname $BASE_PATH))\[\033[0m\] \[\033[33m\]\u\[\033[1;33m\]$\[\033[0m\] "

