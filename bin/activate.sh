#!/bin/bash

# @credit http://stackoverflow.com/a/246128/330439
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do
  DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
done
BASE_PATH="$( cd -P "$( dirname "$SOURCE" )" && pwd )"


# TODO: Generic bash function that ensures we are not called twice in same run thus
#       creating an infinite loop.
if [ "$_ACTIVATED_IO_DEVCOMP" == true ]; then
	return;
fi
export _ACTIVATED_IO_DEVCOMP=true


export PIO_SERVICES_PATH="$BASE_PATH/../../os.inception/services:$PIO_SERVICES_PATH"

. $BASE_PATH/../../$(basename $(dirname $BASE_PATH)).activate.sh


export PATH=$BASE_PATH:$PATH
