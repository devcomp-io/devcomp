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


export PATH="$BASE_PATH:$PATH"

ulimit -Sn 8192

# TODO: Relocate into plugin.
alias snap='osascript $BASE_PATH/../services/devcomp/io.devcomp.osx/scripts/LaunchSnapzProX.scpt'
# TODO: Add watch process that will upload screenshot once saved.



if hash node 2>/dev/null; then
	echo "" > /dev/null
else
	# @see https://github.com/creationix/nvm
	if [ -f "$HOME/.profile" ]; then
		. "$HOME/.profile"
	elif [ -f "$HOME/.bash_profile" ]; then
		. "$HOME/.bash_profile"
	fi
	if hash nvm 2>/dev/null; then
		echo "nvm: $(which nvm) ($(nvm --version))"
	else
		# TODO: Ask user before installing nvm.
		echo "Installing nvm ..."
		curl https://raw.githubusercontent.com/creationix/nvm/v0.6.1/install.sh | sh
	fi
	if [ -f "$HOME/.profile" ]; then
		. "$HOME/.profile"
	elif [ -f "$HOME/.bash_profile" ]; then
		. "$HOME/.bash_profile"
	fi
	nvm use 0.10
fi
echo "node: $(which node) ($(node -v))"
echo "npm: $(which npm) ($(npm -v))"



# @see http://www.cyberciti.biz/tips/howto-linux-unix-bash-shell-setup-prompt.html
# @see http://www.tldp.org/HOWTO/Bash-Prompt-HOWTO/x329.html
function parse_git_branch {
  git branch --no-color 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/\1/'
}
PS1="\[\033[1;34m\]\[\033[47m\](OS)\[\033[0m\] \[\033[1;35m\]$(basename "$(dirname "$BASE_PATH")")\[\033[0m\][$(parse_git_branch)] \[\033[33m\]\u\[\033[1;33m\]$\[\033[0m\] "



if [ ! -d "node_modules" ]; then
	echo ""
	echo "ACTION: Run 'bin/install.sh' next!"
	echo ""
else
	export PIO_PROFILE_ENDPOINT="https://s3-us-west-1.amazonaws.com/dev.genesis.pio.profile.registry"
	bin/pio-ensure-credentials
fi


if [ -f "$BASE_PATH/../../$(basename $(dirname $BASE_PATH)).activate.sh" ]; then
	. "$BASE_PATH/../../$(basename $(dirname $BASE_PATH)).activate.sh"
fi
