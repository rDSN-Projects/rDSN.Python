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
from StringIO import StringIO
from ctypes import *
from dev.python.NativeCall import *
import jinja2
import ast


JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)


#webapp2 handlers

class BaseHandler(webapp2.RequestHandler):
    def render_template(self, view_filename, params=None):
	if not params:
            params = {}
        path = 'static/view/' + view_filename

	template = JINJA_ENVIRONMENT.get_template(path)
        self.response.out.write(template.render(params))
    def SendJson(self, r):
        self.response.headers['content-type'] = 'text/plain'
        self.response.write(json.dumps(r))

    def geneRelate(self,task_code,params):
        task_list = sorted(ast.literal_eval(Native.dsn_cli_run('query task_list')))
	call_list = ast.literal_eval(Native.dsn_cli_run('query call '+task_code))
        caller_list = call_list[0]
        callee_list = call_list[1]
	sharer_list = ast.literal_eval(Native.dsn_cli_run('query pool_sharer '+task_code))

	params['TASK_CODE'] = task_code
	params['TASK_LIST'] = task_list
	params['CALLER_LIST'] = caller_list
	params['CALLEE_LIST'] = callee_list
	params['SHARER_LIST'] = sharer_list

#webapp2 handlers
class mainHandler(BaseHandler):
    def get(self):
        self.render_template('main.html')

class tableHandler(BaseHandler):
    def get(self):
	queryRes = ast.literal_eval(Native.dsn_cli_run('query table'))
	params = {
            'TABLE': queryRes
        }
	self.render_template('table.html',params)

class perValue1Handler(BaseHandler):
    def get(self):
	params = {}
	task_code = self.request.get('task_code')
	if task_code=='':
	    task_code = 'RPC_NFS_COPY'
	self.geneRelate(task_code,params)

	queryRes = ast.literal_eval(Native.dsn_cli_run('query counter_sample '+task_code))
	xtitles = queryRes[0]
	tabledata = queryRes[1]
	
	params['XTITLES'] = xtitles
	params['TABLEDATA'] = tabledata
	params['COMPAREBUTTON'] = 'no'
	self.render_template('perValue1.html',params)

class perValue3Handler(BaseHandler):
    def get(self):
       	params = {}
	task_code = self.request.get('task_code')
	if task_code=='':
	    task_code = 'RPC_NFS_COPY'
	self.geneRelate(task_code,params)

        ifcompare = self.request.get('ifcompare');
        if ifcompare=='':
	    ifcompare = 'no'

	queryRes = ast.literal_eval(Native.dsn_cli_run('query counter_structure '+task_code))
        tabledata = {}
	tabledata['nc']=[queryRes[0]]
	tabledata['qs']=[queryRes[1]]
	tabledata['es']=[queryRes[2]]
	tabledata['nr']=[queryRes[3]]
	tabledata['qc']=[queryRes[4]]
	tabledata['ec']=[queryRes[5]]
	tabledata['a']=[queryRes[6]]

        
        if ifcompare=='yes':
            sharer_list = ast.literal_eval(Native.dsn_cli_run('query pool_sharer '+task_code))
            compare_list = sorted(sharer_list,key=lambda sharer: float(ast.literal_eval(Native.dsn_cli_run('query counter_structure '+sharer))[2])*float(ast.literal_eval(Native.dsn_cli_run('query counter_structure '+sharer))[4]),reverse=True)[:16]
	    for compare_item in compare_list:
                if compare_item=='' or '_ACK' in compare_item:
		    continue
	        item_data = ast.literal_eval(Native.dsn_cli_run('query counter_structure '+compare_item))
	        tabledata['nc'].append(item_data[0])
	        tabledata['qs'].append(item_data[1])
	        tabledata['es'].append(item_data[2])
	        tabledata['nr'].append(item_data[3])
	        tabledata['qc'].append(item_data[4])
	        tabledata['ec'].append(item_data[5])
	        tabledata['a'].append(item_data[6])
	    params['IFCOMPARE'] = 'yes'
	    params['COMPARE_LIST'] = compare_list
        
	params['TABLEDATA'] = tabledata
	params['COMPAREBUTTON'] = 'yes'
	self.render_template('perValue3.html',params)
#Entries for threads
class serverThread (threading.Thread):
    def run(self):
        start_http_server()

def start_http_server():  
    static_app = webob.static.DirectoryApp("static")
    public_app = webob.static.DirectoryApp("public")
    web_app = webapp2.WSGIApplication([
    ('/', mainHandler),
     ('/main.html', mainHandler),
    ('/table.html', tableHandler),
    ('/perValue1.html', perValue1Handler),
    ('/perValue3.html', perValue3Handler),
 
], debug=True)

    app_list = Cascade([static_app, web_app,public_app])

    httpserver.serve(app_list, host='10.172.96.42', port='8080')
    #httpserver.serve(app_list, host='127.0.0.1', port='8080')

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
    

