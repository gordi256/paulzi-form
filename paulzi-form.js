/**
 * PaulZi-Form module
 * Provide: ajax submit, delete empty fields before submit, submit button style, form alert.
 * @module paulzi/form
 * @version 2.3.0
 * @author PaulZi (pavel.zimakoff@gmail.com)
 * @license MIT (https://github.com/Paul-Zi/paulzi-form/blob/master/LICENSE)
 * @see https://github.com/Paul-Zi/paulzi-form
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        factory(root.jQuery);
    }
}(this, function ($) {

    /**
     * Append alert to form output
     * @memberOf jQuery.fn
     * @param {jQuery} html - alert contents
     * @param {string} type - alert CSS type
     * @return {jQuery} alert element
     */
    $.fn.formAlert = function(html, type)
    {
        var output = $(this).find('output, .form-output').first();
        
        var div;
        if (typeof(html) !== 'string' && $(html).hasClass('alert')) {
            div = html;
        } else {
            type = type || 'info';
            div = $('<div role="alert" class="alert alert-' + type + '">')
                .append(html);
        }
        
        if ($.fn.alert) {
            div.addClass(['alert-dismissible']);
            $('<button type="button" class="close" aria-label="close" data-dismiss="alert">')
                .html('<span aria-hidden="true">&times;</span>')
                .prependTo(div);
        }
        
        div.addClass('fade in').appendTo(output);
        return div;
    };
    
    
    // is submit
    var isSubmit = function(item) {
        return $.inArray(item.prop('tagName'), ['INPUT', 'BUTTON']) !== -1
            && $.inArray(item.attr('type').toLowerCase(), ['submit', 'image']) !== -1;
    };
    
    
    // btn-loading
    var btnLoadingSubmitHandler = function(e) {
        if (e.isDefaultPrevented()) return false;
        if ($(this).hasClass('form-loading')) {
            e.preventDefault();
            return false;
        }
        $(this).addClass('form-loading');
        
        var btn = $(document.activeElement).filter('.btn-loading');
        if (!isSubmit(btn)) {
            btn = $(this).find('.btn-loading.btn-submit-default');
        }
        btn.addClass('disabled');
        
        var loadingText = btn.data('loadingText');
        if (loadingText) {
            btn.data('loadingText', btn.text());
            btn.text(loadingText);
        }
        
        var loadingIcon = btn.data('loadingIcon');
        if (loadingIcon) {
            $('<span>&nbsp;</span>').addClass('btn-loading-space').prependTo(btn);
            $('<i>').addClass('btn-loading-icon').addClass(loadingIcon).prependTo(btn);
        }
    };
    
    var btnLoadingFormAjaxAlwaysHandler = function(e) {
        var btn = $(this).find('.btn-loading.disabled');
        btn.removeClass('disabled');
        btn.children('.btn-loading-icon, .btn-loading-space').remove();
        btn.each(function(){
            var loadingText = $(this).data('loadingText');
            if (loadingText) {
                $(this).data('loadingText', $(this).text());
                $(this).text(loadingText);
            }
        });
    };
    
    $(document).on('submit.paulzi-form',         'form',         btnLoadingSubmitHandler);
    $(document).on('formajaxalways.paulzi-form', '.form-ajax',   btnLoadingFormAjaxAlwaysHandler);
    

    var _formAttrSupport;

    var formAttrList = ['action', 'enctype', 'method', 'target'];

    var formAttrSupport = function() {
        if (typeof(_formAttrSupport) !== 'undefined') {
            return _formAttrSupport;
        }
        var input   = document.createElement('input');
        var form    = document.createElement('form');
        var formId  = '__test-input-form-reference-support';
        form.id = formId;
        document.body.appendChild(form);
        document.body.appendChild(input);
        input.setAttribute('form', formId);
        //for (var i=0; i < form.length; i++) {
        //    alert('support: ' + (form[i] == input));
        //}
        _formAttrSupport = (input.form === form);
        document.body.removeChild(form);
        document.body.removeChild(input);
        return _formAttrSupport;
    };

    var formActionAttrSupport = function() {
        var input = document.createElement("input");
        return !!('formAction' in input);
    };

    // form html5 attributes polyfill
    var attrPolyfillSubmitHandler = function(e) {
        var that  = this;
        var $form = $(this);
        if (!formAttrSupport()) {
            var id = $form.attr('id');
            if (id) {
                var list = $('[form="' + id + '"]')
                    .not('form#' + id + ' [form="' + id + '"]')
                    .filter(function(){
                        return this.name && !$(this).is(':disabled') && (this.checked || (this.type !== 'checkbox' && this.type !== 'radio'));
                    }).each(function(){
                        $('<input type="hidden">')
                            .attr('name', this.name)
                            .val($(this).val())
                            .addClass('form-html5-attributes-polyfill')
                            .appendTo(that);
                    });
            }
        }
        if (!formActionAttrSupport()) {
            var btn = $(document.activeElement);
            if (isSubmit(btn)) {
                $.each(formAttrList, function (i, a) {
                    var attr = btn.attr('form' + a);
                    if (attr) {
                        $form.data('formAttrPolyfill' + a, attr);
                        $form.attr(a, attr);
                    }
                });
            }
        }
    };

    var attrPolyfillFormAjaxAlwaysHandler = function(e) {
        var $form = $(this);
        if (!formAttrSupport()) {
            $form.find('.form-html5-attributes-polyfill').remove();
        }
        if (!formActionAttrSupport()) {
            $.each(formAttrList, function (i, a) {
                if ($form.hasData('formAttrPolyfill' + a)) {
                    $form.attr(a, $form.data('formAttrPolyfill' + a));
                    $form.removeData('formAttrPolyfill' + a);
                }
            });
        }
    };

    $(document).on('submit.paulzi-form',         'form', attrPolyfillSubmitHandler);
    $(document).on('formajaxalways.paulzi-form', 'form', attrPolyfillFormAjaxAlwaysHandler);


    // form-no-empty
    var noEmptySubmitHandler = function(e) {
        $(this)
            .find(':enabled')
            .filter(function(){ return this.value==''; })
            .addClass('form-no-empty-item')
            .each(function(){ this.disabled = true; });
        return true;
    };
    
    var noEmptyFormAjaxAlwaysHandler = function(e) {
        $(this)
            .find('.form-no-empty-item')
            .removeClass('form-no-empty-item')
            .each(function(){ this.disabled = false; });
    };
    
    $(document).on('submit.paulzi-form',         '.form-no-empty',   noEmptySubmitHandler);
    $(document).on('formajaxalways.paulzi-form', '.form-no-empty',   noEmptyFormAjaxAlwaysHandler);
    
    
    // form-ajax
    var inputImageClickHandler = function(e) {
        var offset = $(this).offset();
        $(this).prop('paulziFormX', e.pageX - offset.left);
        $(this).prop('paulziFormY', e.pageY - offset.top);
    };
    
    var ajaxSubmitHandler = function(e) {
        if (e.isDefaultPrevented()) return false;
        if ($(document.activeElement).hasClass('btn-no-ajax')) {
            return true;
        }
        e.preventDefault();
        
        var form = $(this);
        var output = form.find('output, .form-output').empty();
        if (form.data('form-output')) {
            output = $(form.data('form-output'));
        }
        
        var doneCallback = function(data, textStatus, jqXHR) {
            var event = jQuery.Event("formajaxdone");
            form.trigger(event, arguments);
            if (event.isDefaultPrevented()) return;
            
            if (typeof(data) !== 'string') return;
            data = $($.parseHTML(data, true));
            var redirect = data.data('redirect');
            if (redirect) {
                document.location.href = redirect;
                return;
            }
            form.trigger('contentprepare', [data]);
            if (data.hasClass('form-replace')) {
                form.replaceWith(data);
            } else {
                if (data.hasClass('alert')) {
                    form.formAlert(data);
                } else {
                    output.html(data);
                }
            }
            form.trigger('contentinit', [data]);
        };
        
        var failCallback = function(jqXHR, textStatus, errorThrown) {
            var event = jQuery.Event("formajaxfail");
            form.trigger(event, arguments);
            if (event.isDefaultPrevented()) return;
            
            var alert = false;
            if (jqXHR.responseText) alert = $($.parseHTML(jqXHR.responseText, true));
            if (alert && alert.hasClass('alert')) {
                form.formAlert(alert);
            } else {
                form.formAlert(['[' + textStatus + ']', errorThrown, jqXHR.responseText].join(' '), 'danger');
            }
        };
        
        var alwaysCallback = function() {
            var event = jQuery.Event("formajaxalways");
            form.trigger(event, arguments);
            if (event.isDefaultPrevented()) return;
            
            form.removeClass('form-loading');
        };
        
        var beforeSendCallback = function(jqXHR, settings) {
            var event = jQuery.Event("formajaxbefore");
            form.trigger(event, [jqXHR, settings]);
            return !event.isDefaultPrevented();
        };
        
        if (form.attr('enctype') == 'multipart/form-data' && typeof($.fn.ajaxSubmit) === 'function') {
            // if exists file in form and included jquery.form plugin, use it. @see: http://malsup.com/jquery/form/
            form.ajaxSubmit({
                beforeSubmit: function(arr, $form, options) {
                    options.beforeSend = beforeSendCallback;
                },
                success:        doneCallback,
                error:          failCallback,
                complete:       alwaysCallback,
                data:           {"X-Requested-With": "XMLHttpRequest"},
                uploadProgress: function(event) {
                    var percent = 0;
                    var loaded = event.loaded || event.position;
                    var total = event.total;
                    if (event.lengthComputable) {
                        percent = loaded / total * 100;
                    }
                    form.trigger('formajaxprogress', [loaded, total, percent]);
                }
            });
        } else {
            var data = form.serializeArray();
            var btn = $(document.activeElement);
            if (btn.attr('name') && !btn.is(":disabled") && isSubmit(btn)) {
                data.push({name: btn.attr('name'), value: btn.val()});
                if (btn.prop('paulziFormX')) {
                    data.push({name: btn.attr('name') + '.x', value: btn.prop('paulziFormX')});
                    btn.removeProp('paulziFormX');
                }
                if (btn.prop('paulziFormY')) {
                    data.push({name: btn.attr('name') + '.y', value: btn.prop('paulziFormY')});
                    btn.removeProp('paulziFormY');
                }
            }
            $.ajax({
                method:     form.attr('method') || 'GET',
                url:        form.attr('action'),
                data:       data,
                beforeSend: beforeSendCallback
            })
            .done(doneCallback)
            .fail(failCallback)
            .always(alwaysCallback);
        }
            
        return false;
    };
    
    $(document).on('click.paulzi-form',     'input[type="image"]',  inputImageClickHandler);
    $(document).on('submit.paulzi-form',    '.form-ajax',           ajaxSubmitHandler);
}));