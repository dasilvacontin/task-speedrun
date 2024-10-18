import React, { useState, useEffect } from 'react';
import './App.css';

function Header() {
  return <div className="c-Header">Task Speedrun</div>;
}

function TaskRow({ index, task, promptEditTask, durationToTimeString, dateToTimeString }) {
  const { name, status, targetFinishTime, timeDiff } = task;

  const handleClick = () => {
    if (status === 'TODO') {
      promptEditTask(index);
    }
  };

  return (
    <div className={`c-TaskRow ${status}`} onClick={handleClick}>
      <p className="c-TaskRow__task-name">{name}</p>
      {status !== 'TODO' && (
        <p className="timeDiff">{durationToTimeString(timeDiff, true)}</p>
      )}
      <p className="targetFinishTime">{dateToTimeString(targetFinishTime)}</p>
    </div>
  );
}

function ActiveTaskRow({
  task,
  completeTask,
  durationToTimeString,
  dateToTimeString,
}) {
  const { name, targetDuration, currentDuration, targetFinishTime } = task;
  const now = new Date();

  return (
    <div className="c-ActiveTaskRow" onClick={completeTask}>
      <p className="c-Label">Current task</p>
      <p>{name}</p>
      <p className="c-Label">Target</p>
      <p>{durationToTimeString(targetDuration)}</p>
      <p className="c-Label">Task time</p>
      <p>{durationToTimeString(currentDuration)}</p>
      <p className="c-Label">Target Finish</p>
      <p>{dateToTimeString(targetFinishTime)}</p>
      <p className="c-Label">Current Time</p>
      <p>{dateToTimeString(now)}</p>
    </div>
  );
}

function FinishDetails({ expectedFinishTime, targetFinishTime, dateToTimeString }) {
  return (
    <div className="c-FinishDetails">
      <p>Expected finish</p>
      <p>{dateToTimeString(expectedFinishTime)}</p>
      <p>Target finish</p>
      <p>{dateToTimeString(targetFinishTime)}</p>
    </div>
  );
}

function App() {
  const [routine, setRoutine] = useState([]);
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [expectedFinishTime, setExpectedFinishTime] = useState(null);
  const [targetFinishTime, setTargetFinishTime] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      logic();
    }, 100);
    return () => clearInterval(interval);
  }, [routine, started]);

  const TaskStatus = {
    TODO: 'TODO',
    DOING: 'DOING',
    FINISHED_SUCCESS: 'FINISHED_SUCCESS',
    FINISHED_FAILED: 'FINISHED_FAILED',
  };

  const logic = () => {
    let activeTask = null;
    let targetFinish = startTime || new Date();
    let expectedFinish = targetFinish;

    const updatedRoutine = routine.map((task) => {
      if (task.status === TaskStatus.DOING) {
        activeTask = task;
        task.currentDuration = Date.now() - task.startTime.getTime();
      }
      if (!activeTask && started && task.status === TaskStatus.TODO) {
        activeTask = task;
        task.status = TaskStatus.DOING;
        task.startTime = new Date();
        task.currentDuration = 0;
      }

      targetFinish = new Date(targetFinish.getTime() + task.targetDuration);
      if (
        task.status === TaskStatus.FINISHED_FAILED ||
        task.status === TaskStatus.FINISHED_SUCCESS ||
        task.currentDuration > task.targetDuration
      ) {
        expectedFinish = new Date(expectedFinish.getTime() + task.currentDuration);
      } else {
        expectedFinish = new Date(expectedFinish.getTime() + task.targetDuration);
      }

      task.targetFinishTime = targetFinish;
      return task;
    });

    setRoutine(updatedRoutine);
    setExpectedFinishTime(expectedFinish);
    setTargetFinishTime(targetFinish);
  };

  const start = () => {
    setStarted(true);
    setStartTime(new Date());
  };

  const promptCreateTask = () => {
    const input = window.prompt(
      'Create task.\n\nFormat: {Name}, {target duration}.\ne.g. Make bed, 1m'
    );
    if (input) {
      const [name, durationStr] = input.split(',');
      createTask(name, durationStr);
    }
  };

  const createTask = (name, durationStr, status) => {
    const duration = timeStringToDuration(durationStr.trim());
    const newTask = {
      name: name.trim(),
      targetDuration: duration,
      status: status || TaskStatus.TODO,
      startTime: null,
      currentDuration: 0,
      targetFinishTime: null,
    };
    setRoutine([...routine, newTask]);
  };

  const promptEditTask = (index) => {
    const task = routine[index];
    const input = window.prompt(
      'Edit task.\n\nFormat: {Name}, {target duration}.\ne.g. Make bed, 1m',
      `${task.name}, ${durationToTimeString(task.targetDuration)}`
    );
    if (input) {
      const [name, durationStr] = input.split(',');
      editTask(index, name, durationStr);
    }
  };

  const editTask = (index, name, durationStr) => {
    const duration = timeStringToDuration(durationStr.trim());
    const updatedTask = { ...routine[index], name: name.trim(), targetDuration: duration };
    const updatedRoutine = [...routine];
    updatedRoutine[index] = updatedTask;
    setRoutine(updatedRoutine);
  };

  const completeTask = () => {
    const index = routine.findIndex((task) => task.status === TaskStatus.DOING);
    if (index !== -1) {
      const now = new Date();
      const updatedTask = { ...routine[index] };
      if (updatedTask.targetFinishTime > now) {
        updatedTask.status = TaskStatus.FINISHED_SUCCESS;
      } else {
        updatedTask.status = TaskStatus.FINISHED_FAILED;
      }
      updatedTask.timeDiff = now - updatedTask.targetFinishTime;
      const updatedRoutine = [...routine];
      updatedRoutine[index] = updatedTask;
      setRoutine(updatedRoutine);
    }
  };

  const timeStringToDuration = (str) => {
    const timeArr = str.split(':').map((t) => parseInt(t, 10));
    let duration = 0;
    let mult = 1;

    while (timeArr.length > 0) {
      const num = timeArr.pop();
      duration += num * mult * 1000;
      mult *= 60;
    }

    return duration;
  };

  const durationToTimeString = (n, prefix = false) => {
    let negative = n < 0;
    if (negative) {
      n *= -1;
    }
    n = Math.floor(n / 1000);

    let timeArr = [];

    while (n >= 1) {
      timeArr.unshift(n % 60);
      n = Math.floor(n / 60);
    }

    if (timeArr.length === 0) timeArr.push(0);
    if (timeArr.length === 1) timeArr.unshift(0);

    timeArr = timeArr.map((num, i) => {
      return num < 10 && i > 0 ? `0${num}` : `${num}`;
    });

    const timeString = timeArr.join(':');
    if (prefix) {
      return (negative ? '-' : '+') + timeString;
    } else {
      return (negative ? '-' : '') + timeString;
    }
  };

  const dateToTimeString = (date) => {
    if (!date) return 'No date'
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const pad = (n) => (n < 10 ? `0${n}` : n);
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  return (
    <div className="App">
      <Header />
      <div className="stack">
        {!started && routine.length > 0 && (
          <div className="c-ButtonRow" onClick={start}>
            Start
          </div>
        )}
        {routine.map((task, index) =>
          task.status === TaskStatus.DOING ? (
            <ActiveTaskRow
              key={index}
              task={task}
              completeTask={completeTask}
              durationToTimeString={durationToTimeString}
              dateToTimeString={dateToTimeString}
            />
          ) : (
            <TaskRow
              key={index}
              index={index}
              task={task}
              promptEditTask={promptEditTask}
              durationToTimeString={durationToTimeString}
              dateToTimeString={dateToTimeString}
            />
          )
        )}
        <div className="c-ButtonRow" onClick={promptCreateTask}>
          +
        </div>
        {routine.length > 0 && (
          <FinishDetails
            expectedFinishTime={expectedFinishTime}
            targetFinishTime={targetFinishTime}
            dateToTimeString={dateToTimeString}
          />
        )}
      </div>
    </div>
  );
}

export default App;
