from paste.cascade import Cascade
from paste import httpserver
import webapp2

import sys
import os
import threading
import thread
import webob.static 
import urllib
import cgi
sys.path.append(os.getcwd() + '/app_package')
from StringIO import StringIO

from ctypes import *
from dev.python.NativeCall import *

#webapp2 handlers
class mainHandler(webapp2.RequestHandler):
    def get(self):
        content = open('static/index_template.html').read()
        self.response.write(content)

class depHandler(webapp2.RequestHandler):
    def get(self):
        content = open('static/dep_template.html').read()
        self.response.write(content)

class perfHandler(webapp2.RequestHandler):
    def get(self):
        content = open('static/perf_template.html').read()
        queryRes = Native.dsn_cli_run('query')
        self.response.write(content.replace('PYINJECTDATA',queryRes))

class analyseHandler(webapp2.RequestHandler):
    def get(self):
        content = open('static/analyse_template.html').read()
        self.response.write(content)

class listDirHandler(webapp2.RequestHandler):
    def get(self):
	content = open('static/listDir_template.html').read()

	path = os.getcwd()+'/public'
        try:
            list = os.listdir(path)
        except os.error:
            self.send_error(404, "No permission to list directory")
            return None
        list.sort(key=lambda a: a.lower())
        f = StringIO()
        displaypath = path
        f.write('<div class="well">Directory listing for %s</div>\n' % displaypath)
	f.write('<ul class="list-group">')
        for name in list:
            fullname = os.path.join(path, name)
            displayname = linkname = name
            # Append / for directories or @ for symbolic links
            if os.path.isdir(fullname):
                displayname = name + "/"
                linkname = name + "/"
            if os.path.islink(fullname):
                displayname = name + "@"
                # Note: a link to a directory displays with @ and links with /
            f.write('<li class="list-group-item"><a href="%s">%s</a></li>\n'
                    % (urllib.quote(linkname), cgi.escape(displayname)))
        f.write("</ul>")
	length = f.tell()
        f.seek(0)
        encoding = sys.getfilesystemencoding()
	self.response.write(content.replace("PYINJECTDATA",f.read()))
	f.close()

class uploadHandler(webapp2.RequestHandler):
    def get(self):
        content = open('static/upload_template.html').read()
        self.response.write(content)
    def post(self):
	raw_file = self.request.get('fileToUpload')
	savedFile = open('tmp','wb')
	savedFile.write(raw_file)
	savedFile.close()
	 
        self.response.write(open('static/uploadsuc_template.html').read())


#Entries for threads
class serverThread (threading.Thread):
    def run(self):
        start_http_server()

def start_http_server():  
    static_app = webob.static.DirectoryApp("static")
    public_app = webob.static.DirectoryApp("public")
    web_app = webapp2.WSGIApplication([
    ('/', mainHandler),
    ('/index.html', mainHandler),
    ('/dep.html', depHandler),
    ('/perf.html', perfHandler),
    ('/analyse.html', analyseHandler),
    ('/listDir.html', listDirHandler),
    ('/upload.html', uploadHandler),
], debug=True)

    app_list = Cascade([static_app, web_app,public_app])


    httpserver.serve(app_list, host='127.0.0.1', port='8080')

def start_dsn():
    argv = (c_char_p*2)()
    argv[0] = b'rDSN.Monitor.exe'
    argv[1] = b'config.ini'
	
    Native.dsn_run(2, argv, c_bool(1))

if __name__ == '__main__':
    _server_thread= serverThread()
    _server_thread.start()

    start_dsn()

    _server_thread.join()
    

