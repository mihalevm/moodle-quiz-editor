let moodlequizeditor = function() {
    let __curretFilename = '';

    function __print_question(qo) {
        let qitems = '';    
        
        qo.qitem.forEach(function(s){
            qitems = qitems + '<div class="qi valign-wrapper offset-s2 col s10"><p><label><input type="checkbox" ' +
                (s.result ? 'checked="checked"':'')+'><span><input type="text" value="' + s.text +
                '"></span></label></p><a nohref title="Удалить" class="control-item-delete" onclick="moodlequizeditor.deleteItem(this)"><i class="material-icons">highlight_off</i></a></div>';
        });

        let template = '<div class="qw"><div class="row"><div class="valign-wrapper col s12"><input type="text" class="qn" value="' + qo.qname +
            '"><a nohref title="Удалить" class="control-name-delete" onclick="moodlequizeditor.deleteQuestion(this)"><i class="material-icons red-text lighten-4">highlight_off</i></a></div></div><div class="row">'+
            qitems+'</div></div>';
        
        $('#wrapper').append(template);
    }

    function __parse_quiz_data(qcontent) {
        let qid = -1;
        let QuizQuestions = [];

        qcontent.split('\n').forEach(function(str){
            if (str.length > 0) {
                let isQName = str.match(/(\-?[\d|\.]+)\%(.+)/);

                if (isQName === null) {
                    if (qid >= 0) {
                      __print_question(QuizQuestions);
                      QuizQuestions = [];
                    }
                    qid++;
                    QuizQuestions = {qid: qid, qname : str, qitem : [] };
                } else if (isQName.length > 0) {
                    QuizQuestions.qitem.push({text : isQName[2], result : parseInt(isQName[1])>0 });
                }
            }
        });
        
        __print_question(QuizQuestions);
    }

    function __load_file_content(o) {
        __progress_control(true);
        $('#wrapper').empty();
        
        let fr = new FileReader(); 

        fr.onload = function(e){ 
            mammoth.extractRawText({arrayBuffer: e.target.result})
                .then(function(res){
                    __parse_quiz_data(res.value);
                    })
                .done(__progress_control(false));
        }; 
               
        fr.readAsArrayBuffer(o.files[0]);         
    }
    
    function __progress_control(s) {
        if (s) {
            $('.progress').show();
        }else {
            $('.progress').hide();
        }
    }
    
    function __download(data, fileName, type="text/plain") {
        const a = document.createElement("a");
        a.style.display = "none";
        document.body.appendChild(a);

        a.href = window.URL.createObjectURL(
            new Blob([data], { type })
        ); 

        a.setAttribute("download", fileName);
        a.click();

        window.URL.revokeObjectURL(a.href);
        document.body.removeChild(a);
    }        
    
    function __buildGIFT() {
        let t = '';
        
        $('#wrapper').find('.qw').each(function(i, o){
            t = t + $(o).find('.qn:first').val() + ' {\n';
            let itCount = 0;

            $(o).find('.qi').each(function(j, k){
                itCount = itCount + ($(k).find('input[type="checkbox"]:first').is(":checked")?1:0);
            });

            $(o).find('.qi').each(function(j, k){
                let w = 100/(itCount!=0?itCount:1);
                
                if (Number(String(w).split('.')[1])>0) {
                    w = w.toFixed(3);
                } else {
                    w = Math.round(w);
                }
                t = t + '~%'+($(k).find('input[type="checkbox"]:first').is(":checked")?'':'-')+w+'%'+ $(k).find('input[type="text"]:first').val() + '\n';
            });
            t = t + '}\n\n';
        }).promise().done(function(){
            __download(t, __curretFilename);
        });
    }
    
    return {
        init: function () {
            __progress_control(false);
            
            $('#fakeinpfile').on('click', function(){
                $('#inputfile').click();
            });
            $('#inputfile').on('change', function(){
                __curretFilename = this.files[0].name;
                __curretFilename = (__curretFilename.split('.'))[0]+'.gift';
                __load_file_content(this);
            });
            
            $('#outputfile').on('click', function(){
                __buildGIFT();
            });
        },

        deleteItem: function (o) {
            $(o).parent().remove();
        },

        deleteQuestion: function (o) {
            $(o).parent().parent().parent().remove();
        },
    };
}();

$(document).ready(function(){
    moodlequizeditor.init();
});
