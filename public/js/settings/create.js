/* global setCreateMultiValues, setGenresValues */
// eslint-disable-next-line no-unused-vars
const openCreateModal = (reset) => {
    if (reset) {
        $('#createForm').trigger("reset");
    }
    $('#createName').removeClass('is-valid is-invalid');
    $('#createFile').removeClass('is-valid is-invalid');
    $('#createDiv').empty();
    $('#createButtonFind').prop('disabled', false);
    $('#createModalClose').prop('disabled', false);
    
    const uploadModal = new bootstrap.Modal('#createModal', {});
    uploadModal.show();
};

// eslint-disable-next-line no-unused-vars
const initSaveNewBundle = () => {
    $("#createButtonFind").on("click", findMetadata);
};

const findMetadata = () => {
    var gameName = $('#createName').val();
    if (!gameName) {
        $('#createName').removeClass('is-valid is-invalid').addClass('is-invalid');
        return;
    }
    $('#createName').removeClass('is-valid is-invalid').addClass('is-valid');
    $.getJSON(`/api/games/metadata?gameName=${encodeURIComponent(gameName)}`, function(result) {
        if (result.length > 0) {
            sessionStorage.setItem('searchResults', JSON.stringify(result));
            var wrapper = '<ul class="list-group">';
            for (let i = 0; i < result.length; i++) {
                const game = result[i];
                // IN THIS CONTEXT, "ID" IS "IGDB_ID"
                wrapper += `<li class="list-group-item">
                      <div class="row">
                        <div class="col">
                          <input class="form-check-input me-1" type="radio" name="igdb_id" value="${game.id}" id="radio${game.id}">
                          <label class="form-check-label" for="radio${game.id}">${game.name} (${new Date(game.first_release_date * 1000).getFullYear()})</label>
                        </div>
                        <div class="col-auto ${game.cover && game.cover.image_id ? '' : 'd-none'}">
                          <i class="bi bi-images" onmouseover="getCover(${game.id}, this)" onmouseout="hideCover()" tabindex="0" data-bs-toggle="popover" data-bs-placement="left" data-bs-title="Cover"></i>
                        </div>
                    </li>`;
            }
            wrapper += `<li class="list-group-item">
                  <div class="row">
                    <div class="col">
                      <input class="form-check-input me-1" type="radio" name="igdb_id" value="-1" id="radio-1">
                      <label class="form-check-label" for="radio-1">Game not listed. <a href="#" onclick="openCreateManuallyModal()">Manually edit</a></label>
                    </div>
                </li>`;
            wrapper += '</ul>';
            $('#createDiv').html(wrapper);
            var radios = $('#createForm').get(0).igdb_id;
            for (var i = 0; i < radios.length; i++) {
                radios[i].addEventListener('change', function() {
                    if (this.id === "radio-1") {
                        $('#createModalSave').removeClass('btn-primary').addClass('btn-secondary');
                        $('#createModalSave').prop("disabled", true);
                    }
                    else if (this) {
                        $('#createModalSave').removeClass('btn-secondary').addClass('btn-primary');
                        $('#createModalSave').prop("disabled", false);
                    }
                });
            }
        }
        else {
            $('#createDiv').html('No matched games. Do you want to <a href="#" onclick="openCreateManuallyModal()">manually edit it?</a>');
        }
    }).fail(function(jqXHR, status, error) {
        appendAlert(`An error has occurred while getting the game information: ${error}`);
    });
};

// eslint-disable-next-line no-unused-vars
const getCover = (igdb_id, parentElement) => {
    hideCover();
    var data_content = parentElement.getAttribute('data-bs-content');
    if (data_content !== null && data_content !== undefined && data_content !== '') {
        new bootstrap.Popover(parentElement, {
            html: true,
            trigger: 'focus'
        }).show();
    }
    else {
        var searchResults = JSON.parse(sessionStorage.searchResults);
        var result = searchResults.filter(function(i) {
            return i.id === igdb_id;
        })[0];
        parentElement.setAttribute('data-bs-content', `<img src='https://images.igdb.com/igdb/image/upload/t_cover_big/${result.cover.image_id}.jpg'>`);
        new bootstrap.Popover(parentElement, {
            html: true,
            trigger: 'focus'
        }).show();
    }
};

const hideCover = () => {
    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
    for (let i = 0; i < popoverTriggerList.length; i++) {
        const element = popoverTriggerList[i];
        var popover = bootstrap.Popover.getInstance(element);
        if(popover) {
            popover.dispose();
            // workaround for https://github.com/twbs/bootstrap/issues/37474
            popover._activeTrigger = {};
            popover._element = document.createElement('noscript'); // placeholder with no behavior
        }
    }
};

// eslint-disable-next-line no-unused-vars
function prepareCreateSave() {
    $('#createModalSave').on('click', () => {
        var validCreateFile = $('#createFile')[0].checkValidity();
        $('#createFile').removeClass('is-valid is-invalid')
            .addClass(validCreateFile ? 'is-valid' : 'is-invalid');
        var validCreateName = $('#createName')[0].checkValidity();
        $('#createName').removeClass('is-valid is-invalid')
            .addClass(validCreateName ? 'is-valid' : 'is-invalid');
        if (validCreateFile && validCreateName) {
    
            if (sessionStorage.searchResults) {
                $('#createModalSave').addClass('d-none');
                $('#createModalSpinner').removeClass('d-none');
                $('#createModalClose').prop("disabled", true);
                $('#createButtonFind').prop("disabled", true);
    
                var searchResults = JSON.parse(sessionStorage.searchResults);
                var igdb_id = $('input[name=igdb_id]:checked', '#createForm').val();
                var result = searchResults.filter(function(i) {
                    return i.id == igdb_id;
                })[0];
                if (result.cover && result.cover.image_id) {
                    $("#createImageUrl").val(`https://images.igdb.com/igdb/image/upload/t_cover_big/${result.cover.image_id}.jpg`);
                }
                $("#createDescription").val(`${(result.summary ? result.summary : '')}`);
    
                if (Array.isArray(result.involved_companies)) {
                    setCreateMultiValues('createDevelopers', result.involved_companies.filter(function (i) {
                        return i.developer;
                    }));
                    setCreateMultiValues('createPublishers', result.involved_companies.filter(function (i) {
                        return i.publisher;
                    }));
                }
                else if (result.involved_companies) {
                    if (result.involved_companies.developer) {
                        setCreateMultiValues('createDevelopers', result.involved_companies);
                    }
                    if (result.involved_companies.publisher) {
                        setCreateMultiValues('createPublishers', result.involved_companies);
                    }
                }
                if (result.genres) {
                    setGenresValues('createGenres', result.genres);
                }
    
                $("#createYear").val(`${new Date(result.first_release_date * 1000).getFullYear()}`);
                if (result.videos && result.videos.length > 0) {
                    $("#createTrailerUrl").val(`https://www.youtube.com/embed/${result.videos[0].video_id}`);
                }
                else if (result.screenshots && result.screenshots.length > 0) {
                    $("#createTrailerUrl").val(`https://images.igdb.com/igdb/image/upload/t_720p/${result.screenshots[0].image_id}.jpg`);
                }
                $("#createName").val(`${result.name}`);
    
                $.ajax({
                    type: "POST",
                    url: "/api/gameEntry/create",
                    data: new FormData( $('#createForm')[0] ), 
                    processData: false,
                    contentType: false,
                    success: () => {
                        appendInfo('Game created');
                    },
                    error: (error) => {
                        if (error.responseJSON && error.responseJSON.message) {
                            appendAlert(error.responseJSON.message);
                        }
                        else {
                            appendAlert(error.message);
                        }
                    },
                    complete: () => {
                        $('#createModal').modal('hide');

                        $('#createModalSave').removeClass('d-none');
                        $('#createModalSpinner').addClass('d-none');
                        $('#createModalClose').prop("disabled", false);
                        $('#createButtonFind').prop("disabled", false);
                    }
                });
            }
        }
    });
}

// eslint-disable-next-line no-unused-vars
function createDevelopersSelectizes() {
    $("#createDevelopers").selectize({
        create: false,
        persist: false,
        closeAfterSelect: true,
        valueField: 'id',
        labelField: 'name',
        searchField: 'name',
        sortField: 'name'
    });
}

// eslint-disable-next-line no-unused-vars
function createPublishersSelectizes() {
    $("#createPublishers").selectize({
        create: false,
        persist: false,
        closeAfterSelect: true,
        valueField: 'id',
        labelField: 'name',
        searchField: 'name',
        sortField: 'name'
    });
}

// eslint-disable-next-line no-unused-vars
function createGenresSelectizes(result) {
    $("#createGenres").selectize({
        create: false,
        persist: false,
        closeAfterSelect: true,
        valueField: 'id',
        labelField: 'name',
        searchField: 'name',
        sortField: 'name',
        options: result
    });
}