omegaup.OmegaUp.on('ready', function() {
  var chosenLanguage = null;
  var statements = {};

  if (window.location.hash) {
    $('#sections').find('a[href="' + window.location.hash + '"]').tab('show');
  }

  $('#sections')
      .on('click', 'a', function(e) {
        e.preventDefault();
        // add this line
        window.location.hash = $(this).attr('href');
        $(this).tab('show');
      });

  var problemAlias = $('#problem-alias').val();
  refreshEditForm(problemAlias);

  // Add typeaheads
  refreshProblemAdmins();
  omegaup.UI.userTypeahead($('#username-admin'));
  omegaup.UI.typeahead($('#groupalias-admin'), omegaup.API.Group.list,
                       function(event, val) {
                         $(event.target).attr('data-alias', val.value);
                       });

  refreshProblemTags();

  omegaup.API.Tag.list({query: ''})
      .then(function(response) {
        var tags = {};
        $('#problem-tags a')
            .each(function(index) { tags[$(this).html()] = true; });
        response.forEach(function(e) {
          if (tags.hasOwnProperty(e.name)) {
            return;
          }
          $('#tags .tag-list')
              .append($('<a></a>')
                          .attr('href', '#tags')
                          .addClass('tag')
                          .addClass('pull-left')
                          .text(e.name));
        });
        $(document)
            .on('click', '.tag', function(event) {
              var tagname = $(this).html();
              var public = $('#tag-public').val();
              $(this).remove();
              omegaup.API.Problem.addTag({
                                   problem_alias: problemAlias,
                                   name: tagname, public: public,
                                 })
                  .then(function(response) {
                    omegaup.UI.success('Tag successfully added!');
                    $('div.post.footer').show();

                    refreshProblemTags();
                  })
                  .fail(omegaup.UI.apiError);

              return false;  // Prevent refresh
            });
      })
      .fail(omegaup.UI.apiError);

  $('#tag-name')
      .typeahead(
          {
            minLength: 2,
            highlight: true,
          },
          {
            source: omegaup.UI.typeaheadWrapper(omegaup.API.Tag.list),
            async: true,
            display: 'name',
          })
      .on('typeahead:select', function(event, val) {
        $(event.target).val(val.name);
      });

  $('#add-admin-form')
      .on('submit', function() {
        var username = $('#username-admin').val();

        omegaup.API.Problem.addAdmin({
                             problem_alias: problemAlias,
                             usernameOrEmail: username,
                           })
            .then(function(response) {
              omegaup.UI.success(omegaup.T.adminAdded);
              $('div.post.footer').show();
              refreshProblemAdmins();
            })
            .fail(omegaup.UI.apiError);

        return false;  // Prevent refresh
      });

  $('#toggle-site-admins')
      .on('change', function() {
        if ($(this).is(':checked')) {
          $('#problem-admins .site-admin').show();
        } else {
          $('#problem-admins .site-admin').hide();
        }
      });

  $('#add-group-admin-form')
      .on('submit', function() {
        omegaup.API.Problem.addGroupAdmin({
                             problem_alias: problemAlias,
                             group: $('#groupalias-admin').attr('data-alias'),
                           })
            .then(function(response) {
              omegaup.UI.success(omegaup.T.groupAdminAdded);
              $('div.post.footer').show();

              refreshProblemAdmins();
            })
            .fail(omegaup.UI.apiError);

        return false;  // Prevent refresh
      });

  $('#download form')
      .on('submit', function() {
        window.location = '/api/problem/download/problem_alias/' +
                          omegaup.UI.escape(problemAlias) + '/';
        return false;
      });

  $('#delete form')
      .on('submit', (function(event) {
            event.preventDefault();
            omegaup.API.Problem.delete({problem_alias: problemAlias})
                .then(function(response) {
                  window.location = '/problem/mine/';
                })
                .fail(omegaup.UI.apiError);
            return false;
          }));

  $('#markdown form')
      .on('submit', function() {
        var promises = [];
        for (var lang in statements) {
          if (!statements.hasOwnProperty(lang)) continue;
          if (typeof statements[lang].current === 'undefined') continue;
          if (statements[lang].current === statements[lang].original) continue;
          promises.push(new Promise(function(resolve, reject) {
            omegaup.API.Problem.updateStatement({
                                 problem_alias: problemAlias,
                                 statement: statements[lang].current,
                                 message: $('#markdown-message').val(),
                                 lang: lang
                               })
                .then(function(response) { resolve(response); })
                .fail(omegaup.T.editFieldRequired);
          }));
        }

        $('.has-error').removeClass('has-error');
        if ($('#markdown-message').val() == '') {
          omegaup.UI.error(omegaup.T.editFieldRequired);
          $('#markdown-message-group').addClass('has-error');
          return false;
        }

        Promise.all(promises)
            .then(function(results) {
              omegaup.UI.success(omegaup.T.problemEditUpdatedSuccessfully);
              for (var lang in statements) {
                statements[lang].original = statements[lang].current;
              }
            })
            .catch(omegaup.UI.apiError);
        return false;
      });

  function refreshProblemAdmins() {
    omegaup.API.Problem.admins({problem_alias: problemAlias})
        .then(function(admins) {
          $('#problem-admins').empty();
          // Got the contests, lets populate the dropdown with them
          for (var i = 0; i < admins.admins.length; i++) {
            var admin = admins.admins[i];
            var siteAdmin = (admin.role == 'site-admin') ? admin.role : '';
            $('#problem-admins')
                .append(
                    $('<tr></tr>')
                        .addClass(siteAdmin)
                        .append($('<td></td>')
                                    .append($('<a></a>')
                                                .attr('href',
                                                      '/profile/' +
                                                          admin.username + '/')
                                                .text(admin.username)))
                        .append($('<td></td>').text(admin.role))
                        .append(
                            (admin.role != 'admin') ?
                                $('<td></td>') :
                                $('<td><button type="button" class="close">' +
                                  '&times;</button></td>')
                                    .on('click', (function(username) {
                                          return function(e) {
                                            omegaup.API.Problem
                                                .removeAdmin({
                                                  problem_alias: problemAlias,
                                                  usernameOrEmail: username,
                                                })
                                                .then(function(response) {
                                                  omegaup.UI.success(
                                                      omegaup.T.adminRemoved);
                                                  $('div.post.footer').show();
                                                  var tr =
                                                      e.target.parentElement
                                                          .parentElement;
                                                  $(tr).remove();
                                                })
                                                .fail(omegaup.UI.apiError);
                                          };
                                        })(admin.username))));
          }
          $('#problem-group-admins').empty();
          // Got the contests, lets populate the dropdown with them
          for (var i = 0; i < admins.group_admins.length; i++) {
            var group_admin = admins.group_admins[i];
            $('#problem-group-admins')
                .append(
                    $('<tr></tr>')
                        .append($('<td></td>')
                                    .append($('<a></a>')
                                                .attr('href',
                                                      '/group/' +
                                                          group_admin.alias +
                                                          '/edit/')
                                                .text(group_admin.name)))
                        .append($('<td></td>').text(group_admin.role))
                        .append(
                            (group_admin.role != 'admin') ?
                                $('<td></td>') :
                                $('<td><button type="button" class="close">' +
                                  '&times;</button></td>')
                                    .on('click', (function(alias) {
                                          return function(e) {
                                            omegaup.API.Problem
                                                .removeGroupAdmin({
                                                  problem_alias: problemAlias,
                                                  group: alias,
                                                })
                                                .then(function(response) {
                                                  omegaup.UI.success(
                                                      omegaup.T
                                                          .groupAdminRemoved);
                                                  $('div.post.footer').show();
                                                  var tr =
                                                      e.target.parentElement
                                                          .parentElement;
                                                  $(tr).remove();
                                                })
                                                .fail(omegaup.UI.apiError);
                                          };
                                        })(group_admin.alias))));
          }

          $('#problem-admins .site-admin').hide();
        })
        .fail(omegaup.UI.apiError);
  }

  $('#tags form')
      .on('submit', function() {
        var tagname = $('#tag-name').val();
        var public = $('#tag-public').val();

        omegaup.API.Problem.addTag({
                             problem_alias: problemAlias,
                             name: tagname, public: public,
                           })
            .then(function(response) {
              omegaup.UI.success('Tag successfully added!');
              $('div.post.footer').show();

              refreshProblemTags();
            })
            .fail(omegaup.UI.apiError);

        return false;  // Prevent refresh
      });

  function refreshProblemTags() {
    omegaup.API.Problem
        .tags({problem_alias: problemAlias, include_autogenerated: false})
        .then(function(result) {
          $('#problem-tags').empty();
          // Got the contests, lets populate the dropdown with them
          for (var i = 0; i < result.tags.length; i++) {
            var tag = result.tags[i];
            $('#problem-tags')
                .append(
                    $('<tr></tr>')
                        .append(
                            $('<td></td>')
                                .append($('<a></a>')
                                            .attr('href',
                                                  '/problem/?tag[]=' + tag.name)
                                            .text(tag.name)))
                        .append($('<td></td>').text(tag.public))
                        .append(
                            $('<td><button type="button" class="close">' +
                              '&times;</button></td>')
                                .on('click', (function(tagname) {
                                      return function(e) {
                                        omegaup.API.Problem.removeTag({
                                                             problem_alias:
                                                                 problemAlias,
                                                             name: tagname,
                                                           })
                                            .then(function(response) {
                                              omegaup.UI.success(
                                                  'Tag successfully removed!');
                                              $('div.post.footer').show();
                                              var tr = e.target.parentElement
                                                           .parentElement;
                                              $('#tags .tag-list')
                                                  .append(
                                                      '<a href="#tags" ' +
                                                      'class="tag pull-left">' +
                                                      $(tr).find('a').html() +
                                                      '</a>');
                                              $(tr).remove();
                                            })
                                            .fail(omegaup.UI.apiError);
                                      };
                                    })(tag.name))));
          }
        })
        .fail(omegaup.UI.apiError);
  }

  var imageMapping = {};
  var markdownConverter =
      omegaup.UI.markdownConverter({preview: true, imageMapping: imageMapping});
  var markdownEditor =
      new Markdown.Editor(markdownConverter, '-statement');  // Global.
  markdownEditor.run();

  function refreshEditForm(problemAlias) {
    if (problemAlias === '') {
      $('input[name=title]').val('');
      $('input[name=time_limit]').val('');
      $('input[name=validator_time_limit]').val('');
      $('input[name=overall_wall_time_limit]').val('');
      $('input[name=extra_wall_time]').val('');
      $('input[name=memory_limit]').val('');
      $('input[name=output_limit]').val('');
      $('input[name=input_limit]').val('');
      $('input[name=source]').val('');
      return;
    }

    omegaup.API.Problem
        .details({problem_alias: problemAlias, statement_type: 'markdown'})
        .then(problemCallback)
        .fail(omegaup.UI.apiError);
  }

  function problemCallback(problem) {
    $('.page-header h1 span')
        .html(omegaup.T.problemEditEditProblem + ' ' +
              omegaup.UI.escape(problem.title));
    $('.page-header h1 small')
        .html('&ndash; <a href="/arena/problem/' + problemAlias + '/">' +
              omegaup.T.problemEditGoToProblem + '</a>');
    $('input[name=title]').val(problem.title);
    $('#statement-preview .title').html(omegaup.UI.escape(problem.title));
    $('input[name=time_limit]')
        .val(omegaup.UI.parseDuration(problem.settings.limits.TimeLimit));
    if (problem.settings.validator.limits) {
      $('input[name=validator_time_limit]')
          .val(omegaup.UI.parseDuration(
              problem.settings.validator.limits.TimeLimit));
    } else {
      $('input[name=validator_time_limit]').val(0);
    }
    $('input[name=overall_wall_time_limit]')
        .val(omegaup.UI.parseDuration(
            problem.settings.limits.OverallWallTimeLimit));
    $('input[name=extra_wall_time]')
        .val(omegaup.UI.parseDuration(problem.settings.limits.ExtraWallTime));
    $('input[name=memory_limit]')
        .val(problem.settings.limits.MemoryLimit / 1024);
    $('input[name=output_limit]').val(problem.settings.limits.OutputLimit);
    $('input[name=input_limit]').val(problem.input_limit);
    $('input[name=source]').val(problem.source);
    $('#statement-preview .source').html(omegaup.UI.escape(problem.source));
    $('#statement-preview .problemsetter')
        .attr('href', '/profile/' + problem.problemsetter.username + '/')
        .html(omegaup.UI.escape(problem.problemsetter.name));
    $('input[name=email_clarifications][value=' + problem.email_clarifications +
      ']')
        .attr('checked', 1);
    $('select[name=validator]').val(problem.settings.validator.name);
    var visibility = Math.max(0, Math.min(1, problem.visibility));
    $('input[name=visibility][value=' + visibility + ']').attr('checked', 1);
    if (visibility != problem.visibility) {
      // The problem is banned or promoted, so the user isn't allowed to
      // make change visibility.
      $('input[name=visibility]').attr('disabled', 1);
    }
    $('#languages').val(problem.languages.sort().join());
    $('input[name=alias]').val(problemAlias);

    if (chosenLanguage == null ||
        chosenLanguage == problem.statement.language) {
      chosenLanguage = problem.statement.language;
      if (typeof statements[chosenLanguage] == 'undefined') {
        statements[chosenLanguage] = {
          original: problem.statement.markdown,
          current: problem.statement.markdown
        };
      }
      $('#wmd-input-statement').val(statements[chosenLanguage].current);
      $('#statement-language').val(problem.statement.language);
    } else {
      $('#wmd-input-statement').val('');
    }
    // Extend the current mapping with any new images.
    for (var filename in problem.statement.images) {
      if (!problem.statement.images.hasOwnProperty(filename) ||
          imageMapping.hasOwnProperty(filename)) {
        continue;
      }
      imageMapping[filename] = problem.statement.images[filename];
    }
    markdownEditor.refreshPreview();
    if (problem.slow == 1) {
      $('.slow-warning').show();
    }
  }

  $('#statement-preview-link')
      .on('show.bs.tab', function(e) {
        MathJax.Hub.Queue(['Typeset', MathJax.Hub, $('#wmd-preview').get(0)]);
      });

  $('#statement-language')
      .on('change', function(e) {
        chosenLanguage = $('#statement-language').val();
        omegaup.API.Problem.details({
                             problem_alias: problemAlias,
                             statement_type: 'markdown',
                             show_solvers: false,
                             lang: chosenLanguage
                           })
            .then(problemCallback)
            .fail(omegaup.UI.apiError);
      });

  $('#wmd-input-statement')
      .on('blur', function(e) {
        var currentLanguage = $('#statement-language').val();
        if (!statements.hasOwnProperty(currentLanguage)) {
          statements[currentLanguage] = {
            original: '',
            current: '',
          };
        }
        statements[currentLanguage].current = $(this).val();
      });
});
