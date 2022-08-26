# INTRODUCTION

Cryptrack is an API gateway that can be used to track digital communication and timestamp electronic messages. It can be used as a third-party middleware and can be easily integrated with any messaging app.

This tool was built using state-of-the-art technology, <b>`Blockchain`</b> to provide a tracking mechanism that can be used to know origin, date, time and spread of any electronic communication/message.

# USAGE


# METHODS
<ul>

<li>

### `handleSend`
<b> Description : </b> This endpoint is used to add a new typed message in blockchain that needs to be later tracked by the tool. 

<b>Parameters :</b>
| Parameter  | Description |
| ------------- | ------------- |
| msg  | contents of the message sent  |
| user | the user who sent the message |
| time | the time when the message was sent |

<b>Return value :</b>
</li>

<li>

### `handleForward`
<b> Description : </b> This endpoint is used to add a forwarded message in blockchain that needs to be later tracked by the tool, while knowing the user from which it was forwarded. 

<b>Parameters :</b>

| Parameter  | Description |
| ------------- | ------------- |
| msg  | contents of the message forwarded  |
| user | the user who forwarded the message |
| time | the time when the message was forwarded |
| prev_user | the user whose message was forwarded |
| prev_time | the time when the forwarded message was received by the previous user |

<b>Return value :</b>
 </li>

<li>

### `handleTrack`
<b> Description : </b> This endpoint is used to track all the users(including the origin user) who forwarded this message. It gives a list of users (based on time) starting from the origin user who wrote the message to current user who sent the same message.

<b>Parameters :</b>

| Parameter  | Description |
| ------------- | ------------- |
| msg  | contents of the message that has to be tracked |
| user | the user who sent the message to be tracked |
| time | the time when the message was received |


<b>Return value :</b> 
</li>

</ul>


