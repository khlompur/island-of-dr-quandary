// eslint-disable-next-line no-unused-vars
const confirmDeleteGame = () => {
    var gameId = $("#idToDelete").val();
    $("#idToDelete").val("");
    $.ajax({
        url: '/api/gameEntry/delete',
        data: { gameId : gameId },
        type: 'DELETE',
        success: () => {
            $('#confirmDeleteModal').modal("hide");
            $("#gamesListLink").trigger("click");
            appendInfo('Game removed');
        }
    });
};

// eslint-disable-next-line no-unused-vars
const openDeleteGameConfirmation = (gameId) => {
    $("#idToDelete").val(gameId);
    $("#confirmDeleteButton").attr("onclick", "confirmDeleteGame()");
    const confirmDeleteModal = new bootstrap.Modal('#confirmDeleteModal', {});
    confirmDeleteModal.show();
};
