from MonitorCodeDefinition import *

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
import subprocess
import json
import psutil

sys.path.append(os.getcwd() + '/app_package')

def jinja_max(a,b):
    return max(a,b)
JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)
JINJA_ENVIRONMENT.globals.update(jinja_max=jinja_max)

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
        task_list = sorted(ast.literal_eval(Native.dsn_cli_run('pq task_list')))
        call_list = ast.literal_eval(Native.dsn_cli_run('pq call '+task_code))
        callee_list = call_list[0]
        caller_list = call_list[1]

        task_dict = {}
        call_task_list = []
        link_list = []

        task_dict[task_code] = 0
        call_task_list.append(task_code)
        for task in callee_list:
            if task['name'] not in task_dict:
                task_dict[task['name']] = len(task_dict)
                call_task_list.append(task['name'])
            link_list.append({"source":task_dict[task_code],"target":task_dict[task['name']],"value":task['num']})
        for task in caller_list:
            if task['name'] not in task_dict:
                task_dict[task['name']] = len(task_dict)
                call_task_list.append(task['name'])
            link_list.append({"source":task_dict[task['name']],"target":task_dict[task_code],"value":task['num']})

        for callee in callee_list:
            single_list = ast.literal_eval(Native.dsn_cli_run('pq call '+callee['name']))[0]
            for task in single_list:
                if task['name'] not in task_dict:
                    task_dict[task['name']] = len(task_dict)
                    call_task_list.append(task['name'])
            link_list.append({"source":task_dict[callee['name']],"target":task_dict[task['name']],"value":task['num']})

        for caller in caller_list:
            single_list = ast.literal_eval(Native.dsn_cli_run('pq call '+caller['name']))[1]
            for task in single_list:
                if task['name'] not in task_dict:
                    task_dict[task['name']] = len(task_dict)
                    call_task_list.append(task['name'])
            link_list.append({"source":task_dict[task['name']],"target":task_dict[caller['name']],"value":task['num']})
        

        sharer_list = ast.literal_eval(Native.dsn_cli_run('pq pool_sharer '+task_code))
        params['TASK_CODE'] = task_code
        params['TASK_LIST'] = task_list
        params['CALLER_LIST'] = caller_list
        params['CALLEE_LIST'] = callee_list
        params['CALL_TASK_LIST'] = call_task_list 
        params['LINK_LIST'] = link_list
        params['SHARER_LIST'] = sharer_list

#webapp2 handlers
class mainHandler(BaseHandler):
    def get(self):
        self.render_template('main.html')

class tableHandler(BaseHandler):
    def get(self):
        queryRes = ast.literal_eval(Native.dsn_cli_run('pq table'))
        curr_percent = self.request.get('curr_percent')
        if curr_percent == '':
            curr_percent = '50'
        params = {
            'TABLE': queryRes,
            'CURR_PERCENT': curr_percent,
        }
        self.render_template('table.html',params)

class perValue1Handler(BaseHandler):
    def get(self):
        params = {}
        task_code = self.request.get('task_code')
        if task_code=='':
            task_code = 'RPC_NFS_COPY'
        self.geneRelate(task_code,params)

        queryRes = ast.literal_eval(Native.dsn_cli_run('pq counter_sample '+task_code))
        xtitles = queryRes[0]
        tabledata = queryRes[1]
        
        params['PAGE'] = 'perValue1.html'
        params['XTITLES'] = xtitles
        params['TABLEDATA'] = tabledata
        params['COMPAREBUTTON'] = 'no'
        self.render_template('perValue1.html',params)

class perValue2Handler(BaseHandler):
    def get(self):
        params = {}
        task_code = self.request.get('task_code')
        if task_code=='':
            task_code = 'RPC_NFS_COPY'

        queryRes =  ast.literal_eval(Native.dsn_cli_run('pq counter_realtime '+task_code))
        params['PAGE'] = 'perValue2.html'
        params['TABLEDATA'] = queryRes['data']
        self.geneRelate(task_code,params)

        self.render_template('perValue2.html',params)    
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

        queryRes = ast.literal_eval(Native.dsn_cli_run('pq counter_calc '+task_code))
        tabledata = {}
        tabledata['nc']=[queryRes[0]]
        tabledata['qs']=[queryRes[1]]
        tabledata['es']=[queryRes[2]]
        tabledata['nr']=[queryRes[3]]
        tabledata['qc']=[queryRes[4]]
        tabledata['ec']=[queryRes[5]]
        tabledata['a']=[queryRes[6]]
        
        if ifcompare=='yes':
            sharer_list = ast.literal_eval(Native.dsn_cli_run('pq pool_sharer '+task_code))
            #compare_list = sorted(sharer_list,key=lambda sharer: float(ast.literal_eval(Native.dsn_cli_run('pq counter_calc '+sharer))[2])*float(ast.literal_eval(Native.dsn_cli_run('pq counter_raw '+sharer))[7]),reverse=True)[:16]
            compare_list = sorted(sharer_list,key=lambda sharer: float(ast.literal_eval(Native.dsn_cli_run('pq counter_calc '+sharer))[2]),reverse=True)[:16]
            compare_list = [elem for elem in compare_list if ast.literal_eval(Native.dsn_cli_run('pq counter_calc '+elem))[2]!=0]
            for compare_item in compare_list:
                if compare_item=='' or '_ACK' in compare_item:
                    continue
                item_data = ast.literal_eval(Native.dsn_cli_run('pq counter_calc '+compare_item))
                tabledata['nc'].append(item_data[0])
                tabledata['qs'].append(item_data[1])
                tabledata['es'].append(item_data[2])
                tabledata['nr'].append(item_data[3])
                tabledata['qc'].append(item_data[4])
                tabledata['ec'].append(item_data[5])
                tabledata['a'].append(item_data[6])
            params['IFCOMPARE'] = 'yes'
            params['COMPARE_LIST'] = compare_list
        
        params['PAGE'] = 'perValue3.html'
        params['TABLEDATA'] = tabledata
        params['COMPAREBUTTON'] = 'yes'
        self.render_template('perValue3.html',params)

class perValue5Handler(BaseHandler):
    def get(self):
        params = {}
        queryRes = json.loads(Native.dsn_cli_run('system.queue'))
        query_list = []
        for app in queryRes:
            for pool in app['thread_pool']:
                    for queue in pool['pool_queue']:
                        query_list.append({"queue_name":app['app_name']+'@'+pool['pool_name']+'@'+queue['name'],"queue_num":queue['num']})
        query_list = sorted(query_list, key=lambda queue: queue['queue_num'],reverse=True)[:8]
        params['QUEUE_LIST'] = map((lambda queue: queue['queue_name']),query_list)
        params['TABLEDATA'] = map((lambda queue: queue['queue_num']),query_list)
        self.render_template('perValue5.html',params)

class consoleCliHandler(BaseHandler):
    def get(self):
        self.render_template('consoleCli.html')

class execCliHandler(BaseHandler):
    def get(self):
        command = self.request.get('command');
        queryRes = Native.dsn_cli_run(command)
        self.response.write(queryRes)

class consoleBashHandler(BaseHandler):
    def get(self):
        self.render_template('consoleBash.html')

class execBashHandler(BaseHandler):
    def get(self):
        command = self.request.get('command');
        queryRes = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE).stdout.read()
        print queryRes
        self.response.write(queryRes)

class editorHandler(BaseHandler):
    def get(self):
        params = {}
        dir = os.path.join(os.path.dirname(__file__),"..")
        working_dir = self.request.get('working_dir')
        file_name = self.request.get('file_name')
        if file_name != '':
            read_file = open(os.path.join(dir,working_dir, file_name),'r')
            content = read_file.read()
            read_file.close()
        else:
            content = ''

        dir_list = []
        lastPath = ''
        for d in working_dir.split('/'):
            if lastPath!='':
                lastPath += '/'
            lastPath +=d
            dir_list.append({'path':lastPath,'name':d})
        params['FILES'] = [f for f in os.listdir(os.path.join(dir,working_dir)) if os.path.isfile(os.path.join(dir,working_dir,f))]
        params['FILEFOLDERS'] = [f for f in os.listdir(os.path.join(dir,working_dir)) if os.path.isdir(os.path.join(dir,working_dir,f))]
        params['WORKING_DIR'] = working_dir
        params['DIR_LIST'] = dir_list
        params['CONTENT'] = content 
        params['FILE_NAME'] = file_name 
        
        self.render_template('editor.html',params)
    def post(self):
        content = self.request.get('content')
        dir = os.path.dirname(__file__)
        working_dir = self.request.get('working_dir')
        file_name = self.request.get('file_name')
        if file_name != '':
            write_file = open(os.path.join(dir,working_dir, file_name),'w')
            write_file.write(content)
            write_file.close()
            self.response.write("Successfully saved!")
        else:
            self.response.write("No file opened!")

class configureHandler(BaseHandler):
    def get(self):
        params = {}
        queryRes = Native.dsn_cli_run('config-dump')
        params['CONTENT'] = queryRes 
        self.render_template('configure.html',params)

class selectDisplayHandler(BaseHandler):
    def get(self):
        params = {}
        queryRes = ast.literal_eval(Native.dsn_cli_run('pq list_counter'))
        params['COUNTER_LIST'] = queryRes 
        self.render_template('selectDisplay.html',params)

    def post(self):
        counter_list = json.loads(self.request.get('counter_list'))
        queryRes = '{"time":"'+Native.dsn_cli_run('pq time')+'","data":['
        first_flag=0;
        for counter in counter_list:
            if first_flag:
                queryRes += ','
            else:
                first_flag = 1
            res = Native.dsn_cli_run('pq query_counter '+counter_list[counter])
            if res=='':
                res=0
            queryRes += res
        queryRes += ']}'
        self.response.write(queryRes)
class perValue2QueryHandler(BaseHandler):
    def get(self):
        task_code = self.request.get('task_code')
        if task_code=='':
            task_code = 'RPC_NFS_COPY'
        queryRes = Native.dsn_cli_run('pq counter_realtime '+task_code)
        self.response.write(queryRes)

class psutilQueryHandler(BaseHandler):
    def get(self):
        queryRes = {}
        queryRes['cpu'] = psutil.cpu_percent(interval=1);
        queryRes['memory'] = psutil.virtual_memory()[2];
        queryRes['disk'] = psutil.disk_usage('/')[3];
        queryRes['diskio'] = psutil.disk_io_counters(perdisk=False)
        queryRes['networkio'] = psutil.net_io_counters()
        self.response.write(json.dumps(queryRes))


def start_http_server():  
    static_app = webob.static.DirectoryApp("app_package/static")
    web_app = webapp2.WSGIApplication([
    ('/', mainHandler),
    ('/main.html', mainHandler),
    ('/table.html', tableHandler),
    ('/perValue1.html', perValue1Handler),
    ('/perValue2.html', perValue2Handler),
    ('/perValue3.html', perValue3Handler),
    ('/perValue5.html', perValue5Handler),
    ('/consoleCli.html', consoleCliHandler),
    ('/execCli.html', execCliHandler),
    ('/consoleBash.html', consoleBashHandler),
    ('/execBash.html', execBashHandler),
    ('/editor.html', editorHandler),
    ('/configure.html', configureHandler),
    ('/selectDisplay.html', selectDisplayHandler),

    ('/perValue2', perValue2QueryHandler),
    ('/psutil', psutilQueryHandler),
 
], debug=True)

    app_list = Cascade([static_app, web_app])

    httpserver.serve(app_list, host='0.0.0.0', port='8080')
