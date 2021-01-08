let moodlequizeditor = function() {
    let __curretFilename = 'untitled.gift';
    let __lastQID = 0;

    function __print_question(qo) {
        let qitems = '';
        let st = (qo.type === 'single'   ? 'checked' : '');
        let mt = (qo.type === 'multiple' ? 'checked' : '');
        
        qo.qitem.forEach(function(s){
            qitems = qitems + '<div class="qi valign-wrapper offset-s2 col s9"><p><label><input type="checkbox" ' +
                (s.result ? 'checked="checked"':'')+'><span><input type="text" value="' + s.text +
                '"></span></label></p><a nohref title="Удалить ответ" class="control-item-delete" onclick="moodlequizeditor.deleteItem(this)"><i class="material-icons">highlight_off</i></a></div>';
        });

        qitems = qitems + '<div class="qi valign-wrapper offset-s10 col s1 right-align"><a nohref title="Добавить ответ" class="control-item-add" onclick="moodlequizeditor.addItem(this)"><i class="material-icons green-text">add_circle_outline</i></a></div>';
        
        let template = '<div class="qw" id="qw' + qo.qid +'"><div class="row"><div class="valign-wrapper offset-s1 col s10"><input type="text" class="qn" value="' + qo.qname +
            '" onkeyup="moodlequizeditor.changeList(this,'+qo.qid+')"><a nohref title="Удалить вопрос" class="control-name-delete" onclick="moodlequizeditor.deleteQuestion(this,'+ qo.qid +
            ')"><i class="material-icons red-text lighten-4">highlight_off</i></a></div></div><div class="row"><div class="offset-s1 col s11 p0 center-align qt"><label><input name="qtype'+qo.qid+'" type="radio" data-type="multiple" '+mt+' /><span>Несколько правильных</span></label><label><input name="qtype'+qo.qid+'" data-type="single" type="radio" '+st+' /><span>Один правильный</span></label></div>'+
            qitems+'</div>';

        $('#qlist').append('<li id="ql'+ qo.qid +'"><a href="#qw' + qo.qid + '">' + qo.qname + '</a></li>');
        
        $('.addnew').before(template);
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
                    QuizQuestions = {qid: qid, qname : str, qitem : [], type : 'multiple' };
                } else if (isQName.length > 0) {
                    QuizQuestions.qitem.push({text : isQName[2], result : parseInt(isQName[1])>0 });
                }
            }
        });

        __lastQID = qid+1;
        __print_question(QuizQuestions);
    }

    function __clearQuiz() {
        __curretFilename = 'untitled.gift';
        __lastQID = 0;
        
        $('#inputfile').val('');        
        $('#wrapper').empty();
        $('#qlist').empty();
        $('#wrapper').append('<a class="btn-floating btn-large waves-effect waves-light red addnew" nohref onclick="moodlequizeditor.addNewQuestion()" title="Добавить новый вопрос"><i class="material-icons">add</i></a>');
    }

    function __load_file_content(o) {
        __progress_control(true);
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
            let qname = $(o).find('.qn:first').val();

            if (qname.length > 0) {
                t = t + qname + ' {\n';
                let itCount = 0;
                let firstSingle = false;
    
                $(o).find('.qi').each(function(j, k){
                    itCount = itCount + ($(k).find('input[type="checkbox"]:first').is(":checked")?1:0);
                });
                
                let qt = $(o).find("input[type='radio'][name^='qtype']:checked").first().data('type');
    
                $(o).find('.qi').each(function(j, k){
                    let itemText = $(k).find('input[type="text"]:first').val();
                    
                    if (itemText) {
                        if (qt === 'multiple') {
                            let w = 100/(itCount!=0?itCount:1);
                            
                            if (Number(String(w).split('.')[1])>0) {
                                w = w.toFixed(3);
                            } else {
                                w = Math.round(w);
                            }
                            t = t + '~%'+($(k).find('input[type="checkbox"]:first').is(":checked")?'':'-')+w+'%'+ itemText + '\n';
                        } else if (qt === 'single') {
                            let isCorrect = $(k).find('input[type="checkbox"]:first').is(":checked");
                            
                            t = t + (!firstSingle && isCorrect ? '=' : '~') + itemText + '\n';

                            firstSingle = firstSingle || isCorrect;
                        }
                    }
                });
                t = t + '}\n\n';
            }
        }).promise().done(function(){
            if (t) {
                __download(t, __curretFilename);
            } else {
                M.toast({classes:'alert', html: '<span>Нет данных для сохранения</span><button class="btn-flat toast-action" onclick = "M.Toast.dismissAll();"><i class="material-icons">close</i></button>'});
            }
        });
    }
    
    return {
        init: function () {
            __progress_control(false);
            
            $('#fakeinpfile').on('click', function(){
                __clearQuiz();
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

            $('#clearQuiz').on('click', function(){
                __clearQuiz();
            });
            
            $('.modal').modal();
        },

        deleteItem: function (o) {
            $(o).parent().remove();
        },

        deleteQuestion: function (o, qid) {
            $('#ql'+qid).remove();
            $(o).parent().parent().parent().remove();
        },
        
        addNewQuestion: function() {
            QuizQuestions = {qid: __lastQID, qname : '', qitem : [], type : 'single' };
            QuizQuestions.qitem.push({text : '', result : false });
            QuizQuestions.qitem.push({text : '', result : false });
            __print_question(QuizQuestions);
            $('#qw'+__lastQID).find('.qn:first').focus();
            $('#wrapper').animate({ scrollTop: $('#wrapper').prop('scrollHeight') }, 500);
            __lastQID++;
        },
        
        addItem: function (o) {
            $(o).parent().before('<div class="qi valign-wrapper offset-s2 col s9"><p><label><input type="checkbox"><span><input type="text" value=""></span></label></p><a nohref="" title="Удалить" class="control-item-delete" onclick="moodlequizeditor.deleteItem(this)"><i class="material-icons">highlight_off</i></a></div>');
        },
        
        changeList: function(o, qid) {
            $('#ql'+qid).children('a:first').text($(o).val());
        },
    };
}();

$(document).ready(function(){
    moodlequizeditor.init();
});
