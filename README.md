양 방향 이벤트 버스 소켓 서버. 
소켓전용 api-key는 추후 DB에서 관리할 예정. 

해당 키는 배치나 크론잡을 통해 매일 업데이트 할 수 있게할 예정. 

유저 연결 객체 ( NODE WebSocket 으로 이뤄진 유저 LIST ) <ㅡ> 서버 <-> 한투 연결 객체 ( ExternalConnector )
</br>
![socket event bus architecture](https://github.com/sododuk32/socketEventBusServer/blob/main/archi.jpg?raw=true)


이렇게 양방향을 연결하는 서버로서 

서버 기준으로 유저와 한투쪽으로 EventBroker를 사용해 메시지를 보내서 각 클래스의 동작을 사용 및 핸들링함. 

한투측의 정책에따라 하나의 세션만 관리 가능하여 현재는 하나의 세션만이 연결 가능하게 ALLOW_SINGLE_KIS_SESSION로 컨트롤 하고는 있으나 ALLOW_SINGLE_KIS_SESSION를 false로 바꾸면 3자서버 기준 여러 세션,여러 토픽에 대하여 구독가능해짐 


바이낸스의 소캣 기능추가를 염두해두고 여러 세션에 대해 관리 가능한 구조를 선택함. 

만약 처음부터 단일 연결만 가능케한다면 이런 구조까지 필요하진않았음. 
