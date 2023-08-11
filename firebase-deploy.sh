#!/bin/bash

set -x

if [$GCLOUD_PROJECT == "coipond-dev"]
then
    npm run build:dev
else
    exit 1
fi