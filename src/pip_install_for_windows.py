import urllib2
pip_file = urllib2.urlopen('https://bootstrap.pypa.io/get-pip.py').read()
exec(pip_file)
