$(document).ready(function() {

// ajax url
const boardListUrl = "http://newdreams.kr/BootcampusService.asmx/BoardList"
const boardInsertUrl = "http://newdreams.kr/BootcampusService.asmx/InsertBoard"
const boardUpdateUrl = "http://newdreams.kr/BootcampusService.asmx/UpdateBoard"
const boardDeleteUrl = "http://newdreams.kr/BootcampusService.asmx/DeleteBoard"

// ajax 호출 함수
function ajaxCall(url, data, callback) {
  $.ajax({
    url: url,
    type: "get",
    data: data,
    success: function(result) {
      //console.log("ajax결과", result);
      callback(result);
    },
    error: function(xhr, status, error) {
      alert("에러입니다.");
      console.log(xhr, status, error);
    }
  });
}

// 로컬스토리지에 "todoKey"로 저장된 배열을 불러옴
// ||[] -> 없으면 [] 저장하기
const savedTodos = JSON.parse(localStorage.getItem("todoKey"))||[];

// 라벨, 입력창, 추가버튼 감싼 form 태그
const todoForm = $("form");
console.log("todoForm은",todoForm);
// 할 일 입력창
const todoInput = $("#todoTextInput");
// <ul></ul>
const todoList = $("#todoUL");
// 암호화에 사용할 키 값
const secretKey = "Mosti0Soft1";
// 암호화(세션에 들어있는 것)
let encryptedID = sessionStorage.getItem("id");
console.log("세션에 있는 것",encryptedID)
 // 복호화(원래 아이디)
 let decryptedID = CryptoJS.AES.decrypt(encryptedID, secretKey).toString(CryptoJS.enc.Utf8);
//let decryptedPwd = CryptoJS.AES.decrypt(encryptedPwd, secretKey).toString(CryptoJS.enc.Utf8);
$("#todoName").text(`${decryptedID}님의 `);

  // 저장된 할 일 목록을 화면에 보여주기
  printTodo();
  

// 할일을 추가하는 함수 만들기
function addTodo() {
  // 입력한 내용 가져오기
  const todoText = $("#todoTextInput").val().trim();
  // 입력한 내용이 없으면 경고창 뜨기
  if (todoText === "") {
    alert("할 일을 입력하세요.");
    // 입력창에 포커스 주기
    todoInput.focus();
    return;
  }

  // 배열이 없으면 아이디값을 1로 하고, 배열이 있으면 맨 마지막 배열의 아이디에 +1 하기
  let newId = 1;
  if (savedTodos.length > 0) {
    newId = savedTodos.at(-1).ID + 1;
  }

  // 새로운 할 일 객체를 생성하기
  const ajaxInsertData = {
    ID: newId,
    CREATE_USER: decryptedID,
    CONTENTS: todoText,
    TODO_CHECK: 0
  };
  console.log("ajaxInsertData.ID", ajaxInsertData.ID);

  ///////////////////////////////////////////////
  // insert 하는 ajax
  ///////////////////////////////////////////////
  ajaxCall(boardInsertUrl, ajaxInsertData, function(result) {
    console.log(result);
    if (result == 1) {
      console.log("ajaxInsertData의 result", result);
      console.log("입력 성공");
// html로 그려주는 함수에 ajaxInsertData를 전달하기
const todoElement = createTodoElement(ajaxInsertData);
console.log("todoElement는", todoElement)
$(todoList).append(todoElement);

// 입력창 초기화
$(todoInput).val("");

// 투두리스트 체크리스트가 제대로 업데이트되지 않아 다 지우고
$(todoList).empty(todoElement);

// 다시 프린트하는 함수를 호출
printTodo();
      
// 로컬 스토리지에 추가하기
      savedTodos.push(ajaxInsertData);
      localStorage.setItem("todoKey", JSON.stringify(savedTodos));

    }
  });
  ///////////////////////////////////////////////
  ///////////////////////////////////////////////


} //addTodo 끝


// 입력한 데이터를 그려주는 함수
function createTodoElement(ajaxInsertData) {
  //<li id="ajaxInsertData.ID"></li>
  const todoElementNew = $("<li>").attr("id", ajaxInsertData.ID);
  //<input type="checkbox">
  const todoCheckboxNew = $("<input>").attr("type", "checkbox");

  console.log("createTodoElement에서 체크유무",ajaxInsertData.TODO_CHECK) // 새로 입력하면 체크가 0으로 들어가고, 이미 있는 것에는 false가



  // 체크의 유무가 true면 체크가 되도록하고, false면 체크가 안 되도록 한다.
  todoCheckboxNew.prop("checked", ajaxInsertData.TODO_CHECK == true);
  todoCheckboxNew.prop("checked", ajaxInsertData.TODO_CHECK == "1");
  // 체크박스에 체크가 눌리면 completeTodo 함수 호출
  todoCheckboxNew.on("click", completeTodo);
  todoElementNew.append(todoCheckboxNew);


  // <span></span>에 입력한 내용 넣기
  const todoSpanNew = $("<span>").text(ajaxInsertData.CONTENTS);

  // 체크가 1이거나(체크 됨), 체크가 true일 때 
  if (ajaxInsertData.TODO_CHECK == "1" || ajaxInsertData.TODO_CHECK == true) {
    //체크 관련 클래스 넣기
    todoSpanNew.addClass("todo_check");
    todoCheckboxNew.prop("checked", true);
    todoCheckboxNew.prop("checked", 1);
  }

  todoElementNew.append(todoSpanNew);

  // 수정버튼 만들기
  const todoEditButtonNew = $("<button>").text("수정");

  // 수정버튼 눌렀을 때 editTodo함수 호출
  todoEditButtonNew.on("click", editTodo);
  todoElementNew.append(todoEditButtonNew);

  // 삭제버튼 만들기
  const todoDeleteButtonNew = $("<button>").text("삭제");

  // 삭제버튼 눌렀을 때 deleteTodo함수 호출
  todoDeleteButtonNew.on("click", deleteTodo);
  todoElementNew.append(todoDeleteButtonNew);

  return todoElementNew;


}

// 체크박스에 체크가 되면 호출되는 함수
function completeTodo() {
  const todoElement = $(this).parent();
  const todoId = parseInt(todoElement.attr("id"));

  // 체크 여부에 따라 값 저장
  const isChecked = $(this).is(":checked");
  const completedValue = isChecked ? 1 : 0;

  // 서버에 완료 상태를 저장
  const ajaxUpdateData = {
    id: todoId,
    todo_check: completedValue,
    contents: todoElement.find("span").text(),
    update_user: decryptedID
  };
  ajaxCall(boardUpdateUrl, ajaxUpdateData, function(result){
    // 완료 상태를 저장
    const todoIndex = findTodoIndex(todoId);
    //savedTodos[todoIndex].TODO_CHECK = completedValue;

    // 화면에 체크박스 상태를 반영
    const todoSpanNew = todoElement.find("span");
    if (completedValue) {
      todoSpanNew.addClass("todo_check");
    } else {
      todoSpanNew.removeClass("todo_check");
    }
  });
  
}


// 수정하는 함수
function editTodo() {
  const todoElement = $(this).parent();
  const todoSpan = todoElement.find("span");
  const todoId = parseInt(todoElement.attr("id"));
  const todoInput = $("<input>");
  const todoBtn = todoElement.find("button");

  todoInput.val(todoSpan.text());
  todoSpan.replaceWith(todoInput);

  // 체크박스에 체크가 눌리면
  todoBtn.on("click", () => {
    const todoText = todoInput.val().trim();
    let todoCheck = 0;
    if (todoElement.hasClass("checked") || todoElement.find('input[type="checkbox"]').prop('checked')) {
      todoCheck = 1;
    }
    const ajaxUpdateData = {
      id: todoId,
      todo_check: todoCheck,
      contents: todoInput.val(),
      update_user: decryptedID
    };
    // update하는 ajax호출 하기
    ajaxCall(boardUpdateUrl, ajaxUpdateData, function(result){
      console.log("ajaxUpdateData",ajaxUpdateData);
      localStorage.setItem("todoKey", JSON.stringify(savedTodos));
      todoInput.replaceWith(todoSpan);
      todoSpan.text(todoText);
    });
  });
}

// 할 일 삭제하기
function deleteTodo(ajaxInsertData) {
const todoElement = $(this).parent();
console.log("삭제하는 함수에서 todoElement",todoElement)
const todoId = parseInt(todoElement.attr('id'));
console.log("삭제하는 함수에서 todoId",todoId)
boardDeleteData={id:todoId}
ajaxCall(boardDeleteUrl, boardDeleteData, function(result){
console.log(result)
if(confirm("정말 삭제하시겠습니까?")){

// for문 사용해서 id 일치하는 객체 삭제하기
for(let i = 0; i<ajaxInsertData.length; i++){
if(ajaxInsertData[i].ID==todoId){
ajaxInsertData.splice(i,1)
}
}


  // 화면에서 할 일 삭제하기
  todoElement.remove();
  console.log("삭제함수에서 ajaxInsertData",ajaxInsertData)
}
else{
  return;
}
})
}


  

  // 할 일 글 가져오기
  function getTodoText(id) {
    const todoIndex = findTodoIndex(id);
    return savedTodos[todoIndex].text;
  }
  
 
  function findTodoIndex(todoId) {
    for (let i = 0; i < savedTodos.length; i++) {
      if (savedTodos[i].TODO_ID === todoId) {
        return i;
      }
    }
    return -1; // TODO_ID에 해당하는 할 일이 없을 경우 -1 반환
  }
  
  // 저장된 할 일 목록을 화면에 불러오기
  function printTodo() {
    const boardListData = {create_user: decryptedID};
    ajaxCall(boardListUrl, boardListData, function(result) {
      const ajaxResult = JSON.parse(result) || [];
      console.log("ajaxResult",ajaxResult)
  
      for (let i = 0; i < ajaxResult.length; i++) {
        const todo = {
          ID: ajaxResult[i].ID,
          CONTENTS: ajaxResult[i].CONTENTS,
          TODO_CHECK: ajaxResult[i].TODO_CHECK
          
        };
        console.log("ajaxResult[i].TODO_CHECK",ajaxResult[i].TODO_CHECK)
        const todoElement = createTodoElement(todo);
        todoList.append(todoElement);
      }
    });
    
  }
  



  // 할 일을 추가하는 이벤트 
  $(document).on("submit", "#todoForm", function(event) {
    event.preventDefault();
    addTodo();
  }); 
  


})