양 방향 이벤트 버스 소켓 서버. 
소켓전용 api-key는 추후 DB에서 관리할 예정. 

해당 키는 배치나 크론잡을 통해 매일 업데이트. 

유저 연결 객체 ( NODE WebSocket 으로 이뤄진 유저 LIST ) <ㅡ> 서버 <-> 한투 연결 객체 ( ExternalConnector )
[ public clients = new Map<string, SocketClient>() ]  <-> 서버 <-> [ExternalConnector]
 
이렇게 양방향을 연결하는 서버로서 

서버 기준으로 유저와 한투쪽으로 EventBroker를 사용해 메시지를 보내서 각 클래스의 동작을 사용 및 핸들링함. 

각각의 세션을 유지,관리 해야함으로 이런 구조를 사용하였음. 
