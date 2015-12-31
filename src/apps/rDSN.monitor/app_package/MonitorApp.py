from MonitorCodeDefinition import *

from paste.cascade import Cascade
from paste import httpserver
import webapp2
import sys
import os
import inspect
import threading
import thread
import webob.static 
import urllib2
import cgi
from StringIO import StringIO
from ctypes import *
from dev.python.NativeCall import *
import jinja2
import ast
import subprocess
import json
import psutil
import mimetypes

sys.path.append(os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe()))) + '/app_package')

def jinja_max(a,b):
    return max(a,b)

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)
JINJA_ENVIRONMENT.globals.update(jinja_max=jinja_max)

class AppStaticFileHandler(webapp2.RequestHandler):
    def get(self, path):
        abs_path = os.path.abspath(os.path.join('./', path))
        if os.path.isdir(abs_path) or abs_path.find(os.getcwd()) != 0:
            self.response.set_status(403)
            return
        try:
            f = open(abs_path, 'r')
            self.response.headers.add_header('Content-Type', mimetypes.guess_type(abs_path)[0])
            self.response.out.write(f.read())
            f.close()
        except:
            self.response.set_status(404)

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
class PageMainHandler(BaseHandler):
    def get(self):
        params = {}
        params['IFMETA'] = 'meta' in Native.dsn_cli_run('engine')
        self.render_template('main.html',params)

class PageTableHandler(BaseHandler):
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

class PageSampleHandler(BaseHandler):
    def get(self):
        params = {}
        task_code = self.request.get('task_code')
        if task_code=='':
            task_code = 'RPC_NFS_COPY'
        self.geneRelate(task_code,params)

        remote_address = self.request.get('remote_address')
        remote_queryRes = []
        if remote_address != '':
            params['REMOTE_ADDRESS'] = remote_address
            remote_queryRes = list(ast.literal_eval(urllib2.urlopen("http://"+remote_address+"/api/remoteCounterSample?task_code="+task_code).read()))
            
        queryRes = list(ast.literal_eval(Native.dsn_cli_run('pq counter_sample '+task_code)))
        xtitles = []
        xtitles2 = []
        remote_mode = ''

        if remote_address !='':
            remote_mode = 'yes'
            tabledata = [queryRes[1][index] if len(queryRes[1][index])>1 else remote_queryRes[1][index] for index in range(len(queryRes[1]))]
            xtitles = queryRes[0][0:3]
            xtitles2 = queryRes[0][3:6]
        else:
            tabledata = queryRes[1]
            xtitles = queryRes[0]

        params['PAGE'] = 'sample.html'
        params['XTITLES'] = xtitles
        params['XTITLES2'] = xtitles2
        params['REMOTE_MODE'] = remote_mode
        params['TABLEDATA'] = tabledata
        params['COMPAREBUTTON'] = 'no'
        self.render_template('sample.html',params)

class PageValueHandler(BaseHandler):
    def get(self):
        params = {}
        task_code = self.request.get('task_code')
        if task_code=='':
            task_code = 'RPC_NFS_COPY'

        queryRes =  ast.literal_eval(Native.dsn_cli_run('pq counter_realtime '+task_code))
        params['PAGE'] = 'value.html'
        params['TABLEDATA'] = queryRes['data']
        self.geneRelate(task_code,params)

        self.render_template('value.html',params)    
class PageBarHandler(BaseHandler):
    def get(self):
        params = {}
        task_code = self.request.get('task_code')
        if task_code=='':
            task_code = 'RPC_NFS_COPY'
        self.geneRelate(task_code,params)

        ifcompare = self.request.get('ifcompare');
        if ifcompare=='':
            ifcompare = 'no'

        curr_percent = self.request.get('curr_percent')
        params['CURR_PERCENT'] = curr_percent if curr_percent != '' else '50'

        queryRes = list(ast.literal_eval(Native.dsn_cli_run('pq counter_calc '+task_code + ' ' + curr_percent if curr_percent != '50' else '')))

        remote_address = self.request.get('remote_address')
        remote_queryRes = []
        if remote_address != '':
            params['REMOTE_ADDRESS'] = remote_address
            remote_queryRes = list(ast.literal_eval(urllib2.urlopen("http://"+remote_address+"/api/remoteCounterCalc?task_code="+task_code).read()))
        
            if (queryRes[0]==0 and queryRes[1]==0 and queryRes[2]==0):
                queryRes[0] = remote_queryRes[0]
                queryRes[1] = remote_queryRes[1]
                queryRes[2] = remote_queryRes[2]
            if (queryRes[3]==0 and queryRes[4]==0 and queryRes[5]==0):
                queryRes[3] = remote_queryRes[3]
                queryRes[4] = remote_queryRes[4]
                queryRes[5] = remote_queryRes[5]

        tabledata = {}
        tabledata['nc']=[(queryRes[0]-queryRes[3])/2]
        tabledata['qs']=[queryRes[1]]
        tabledata['es']=[queryRes[2]]
        tabledata['nr']=tabledata['nc']
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
        
        params['PAGE'] = 'bar.html'
        params['TABLEDATA'] = tabledata
        params['COMPAREBUTTON'] = 'yes'

        self.render_template('bar.html',params)

class PageQueueHandler(BaseHandler):
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
        self.render_template('queue.html',params)

class PageCliHandler(BaseHandler):
    def get(self):
        self.render_template('cli.html')

class PageBashHandler(BaseHandler):
    def get(self):
        self.render_template('bash.html')


class PageEditorHandler(BaseHandler):
    def get(self):
        params = {}
        dir = os.getcwd()
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

class PageConfigureHandler(BaseHandler):
    def get(self):
        params = {}
        queryRes = Native.dsn_cli_run('config-dump')
        params['CONTENT'] = queryRes 
        self.render_template('configure.html',params)

class PageSelectionHandler(BaseHandler):
    def get(self):
        params = {}
        queryRes = ast.literal_eval(Native.dsn_cli_run('counter.list'))
        params['COUNTER_LIST'] = queryRes 
        self.render_template('selection.html',params)

    def post(self):
        counter_list = json.loads(self.request.get('counter_list'))
        queryRes = '{"time":"'+Native.dsn_cli_run('pq time')+'","data":['
        first_flag=0;

        queryType = self.request.get('queryType')
        if queryType == '':
            queryType = 'sample'

        for counter in counter_list:
            if first_flag:
                queryRes += ','
            else:
                first_flag = 1
            res = Native.dsn_cli_run('counter.'+queryType+'i '+counter_list[counter])
            if res=='':
                res=0
            queryRes += res
        queryRes += ']}'
        self.response.write(queryRes)

class PageFileViewHandler(BaseHandler):
    def get(self):
        params = {}
        dir = os.path.dirname(os.getcwd()+"/")
        working_dir = self.request.get('working_dir')

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
        
        self.render_template('fileview.html',params)
    def post(self):
        params = {}
        dir = os.path.dirname(os.getcwd()+"/")
        working_dir = self.request.get('working_dir')
        
        try:
            raw_file = self.request.get('fileToUpload')
            file_name = self.request.get('file_name')
            savedFile = open(os.path.join(dir,working_dir,file_name),'wb')
            savedFile.write(raw_file)
            savedFile.close()

            params['RESPONSE'] = 'success'
        except:
            params['RESPONSE'] = 'fail'

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

        self.render_template('fileview.html',params)

class PageAnalyzerHandler(BaseHandler):
    def get(self):
        self.render_template('analyzer.html')

'''
class clusterinfoHandler(BaseHandler):
    def get(self):
        params = {}
        metaData = json.loads(Native.dsn_cli_run('meta.info'))
        params['meta'] = json.dumps(metaData,sort_keys=True, indent=4, separators=(',', ': '))
        replicaList = []
        for replica in metaData["_nodes"].keys():
            replicaList.append(replica.split(':')[0])
        replicaList = list(set(replicaList))
        replicaData=[]
        for replica in replicaList:
            replicaSingleData = json.loads(urllib2.urlopen("http://"+replica+":"+str(global_info['portNum'])+"/replicainfo").read())
            replicaData.append(json.dumps(replicaSingleData,sort_keys=True, indent=4, separators=(',', ': ')))
        params['replica'] = replicaData
        self.render_template('clusterinfo.html',params)
'''

class ApiCliHandler(BaseHandler):
    def get(self):
        command = self.request.get('command');
        queryRes = Native.dsn_cli_run(command)
        self.response.write(queryRes)

class ApiBashHandler(BaseHandler):
    def get(self):
        command = self.request.get('command');
        queryRes = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE).stdout.read()
        self.response.write(queryRes)

class ApiValueHandler(BaseHandler):
    def get(self):
        task_code = self.request.get('task_code')
        if task_code=='':
            task_code = 'RPC_NFS_COPY'
        queryRes = Native.dsn_cli_run('pq counter_realtime '+task_code)
        self.response.write(queryRes)

class ApiPsutilHandler(BaseHandler):
    def get(self):
        queryRes = {}
        queryRes['cpu'] = psutil.cpu_percent(interval=1);
        queryRes['memory'] = psutil.virtual_memory()[2];
        queryRes['disk'] = psutil.disk_usage('/')[3];
        queryRes['diskio'] = psutil.disk_io_counters(perdisk=False)
        queryRes['networkio'] = psutil.net_io_counters()
        self.response.write(json.dumps(queryRes))

class ApiReplicaInfoHandler(BaseHandler):
    def get(self):
        queryList = []
        for nodeinfo in Native.dsn_cli_run('engine').split('\n'):
            if 'replica' in nodeinfo:
                queryRes = Native.dsn_cli_run(nodeinfo.split('.')[1]+'.info')
                if 'unknown command' not in queryRes:
                    queryList.append(queryRes)
        queryRes = '[' + ','.join(queryList) + ']'
        self.response.write(queryRes)

class ApiRemoteCounterSampleHandler(BaseHandler):
    def get(self):
        task_code = self.request.get('task_code')
        self.response.write(Native.dsn_cli_run('pq counter_sample '+task_code))

class ApiRemoteCounterCalcHandler(BaseHandler):
    def get(self):
        task_code = self.request.get('task_code')
        curr_percent = self.request.get('curr_percent')
        self.response.write(Native.dsn_cli_run('pq counter_calc '+task_code+' '+curr_percent if curr_percent!='50' else ''))

class ApiSaveViewHandler(BaseHandler):
    def post(self):
        name = self.request.get('name')
        author = self.request.get('author')
        description = self.request.get('description')
        counterList = self.request.get('counterList')
        graphtype = self.request.get('graphtype')
        interval = self.request.get('interval')

        viewFile = open(os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))+'/local/view/'+ name, 'w')

        viewFile.write(author+'\n')
        viewFile.write(description+'\n')
        viewFile.write(counterList+'\n')
        viewFile.write(graphtype+'\n')
        viewFile.write(interval+'\n')

        viewFile.close()
        self.response.write('view "'+ name +'" is successfully saved!')

class ApiLoadViewHandler(BaseHandler):
    def post(self):
        name = self.request.get('name')

        viewFile = open(os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))+'/local/view/'+ name, 'r')

        author = viewFile.readline()
        counterList = viewFile.readline()
        graphtype = viewFile.readline()
        interval = viewFile.readline()

        viewFile.close()
        self.response.write('view "'+ name +'" is successfully saved!')

def start_http_server(portNum):  
    static_app = webob.static.DirectoryApp(os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))+"/static")
    web_app = webapp2.WSGIApplication([
    ('/', PageMainHandler),
    ('/main.html', PageMainHandler),
    ('/table.html', PageTableHandler),
    ('/sample.html', PageSampleHandler),
    ('/value.html', PageValueHandler),
    ('/bar.html', PageBarHandler),
    ('/queue.html', PageQueueHandler),
    ('/cli.html', PageCliHandler),
    ('/bash.html', PageBashHandler),
    ('/editor.html', PageEditorHandler),
    ('/configure.html', PageConfigureHandler),
    ('/selection.html', PageSelectionHandler),
    ('/fileview.html', PageFileViewHandler),
    ('/analyzer.html', PageAnalyzerHandler),
#    ('/clusterinfo.html', clusterinfoHandler),

    ('/api/cli', ApiCliHandler),
    ('/api/bash', ApiBashHandler),
    ('/api/value', ApiValueHandler),
    ('/api/psutil', ApiPsutilHandler),
    ('/api/replicainfo', ApiReplicaInfoHandler),
    ('/api/remoteCounterSample', ApiRemoteCounterSampleHandler),
    ('/api/remoteCounterCalc', ApiRemoteCounterCalcHandler),
    ('/api/saveview', ApiSaveViewHandler),
    ('/api/loadview', ApiLoadViewHandler),

    ('/app/(.+)', AppStaticFileHandler)
], debug=True)

    app_list = Cascade([static_app, web_app])

    httpserver.serve(app_list, host='0.0.0.0', port=str(portNum))
