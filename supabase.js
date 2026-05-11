// ============================================================
// SQLearn - Supabase Config
// ============================================================

const SUPABASE_URL = 'https://pehnzdqvcpvtwpwcutws.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_0IeB_CKKFYR4lY3reSMGyQ_ZYjd4q7U';

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

async function supabaseGetUser() {
  const { data, error } = await supabaseClient.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

async function supabaseGetProfile() {
  const user = await supabaseGetUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email,
    name: profile?.full_name || user.user_metadata?.full_name || user.email,
    avatar:
      profile?.avatar ||
      user.user_metadata?.full_name?.slice(0, 2).toUpperCase() ||
      user.email.slice(0, 2).toUpperCase(),
    profilePic: profile?.profile_pic || null
  };
}

async function supabaseRegisterUser(name, email, password) {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name
      }
    }
  });

  if (error) {
    return {
      ok: false,
      msg: error.message
    };
  }

  if (data.user) {
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({
        id: data.user.id,
        full_name: name.trim(),
        avatar: name.trim().slice(0, 2).toUpperCase(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Profile insert error:', profileError);
    }
  }

  return {
    ok: true,
    user: {
      id: data.user?.id,
      name: name.trim(),
      email,
      avatar: name.trim().slice(0, 2).toUpperCase()
    }
  };
}

async function supabaseLoginUser(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return {
      ok: false,
      msg: error.message
    };
  }

  const profile = await supabaseGetProfile();

  return {
    ok: true,
    user: profile || {
      id: data.user.id,
      email: data.user.email,
      name: data.user.email,
      avatar: data.user.email.slice(0, 2).toUpperCase()
    }
  };
}

async function supabaseLogoutUser() {
  await supabaseClient.auth.signOut();
}

async function supabaseSaveContactMessage(name, email, subject, message) {
  const user = await supabaseGetUser();

  const { error } = await supabaseClient
    .from('contact_messages')
    .insert({
      user_id: user ? user.id : null,
      name,
      email,
      subject,
      message
    });

  if (error) {
    console.error('Contact insert error:', error);
    return {
      ok: false,
      msg: error.message
    };
  }

  return {
    ok: true
  };
}

async function supabaseSaveLessonScore(id, score, total) {
  const user = await supabaseGetUser();

  if (!user) {
    return {
      ok: false,
      msg: 'User is not logged in.'
    };
  }

  const pct = Math.round((score / total) * 100);

  const { error: progressError } = await supabaseClient
    .from('user_progress')
    .upsert(
      {
        user_id: user.id,
        lesson_id: id,
        completed: true,
        score,
        total,
        pct,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: 'user_id,lesson_id'
      }
    );

  if (progressError) {
    console.error('Progress insert error:', progressError);
  }

  const { error: quizError } = await supabaseClient
    .from('quiz_attempts')
    .insert({
      user_id: user.id,
      quiz_id: id,
      score,
      total,
      pct
    });

  if (quizError) {
    console.error('Quiz insert error:', quizError);
  }

  return {
    ok: !progressError && !quizError
  };
}
async function supabaseSaveQuizAttempt(score, total, difficulty) {
  const user = await supabaseGetUser();

  if (!user) {
    return {
      ok: false,
      msg: 'User is not logged in.'
    };
  }

  const pct = Math.round((score / total) * 100);

  const { error } = await supabaseClient
    .from('quiz_attempts')
    .insert({
      user_id: user.id,
      quiz_id: difficulty || 'quiz',
      score,
      total,
      pct
    });

  if (error) {
    console.error('Quiz attempt insert error:', error);

    return {
      ok: false,
      msg: error.message
    };
  }

  return {
    ok: true
  };
}

async function supabaseSavePracticeAttempt(challengeId, queryText, isCorrect) {
  const user = await supabaseGetUser();

  if (!user) {
    return {
      ok: false,
      msg: 'User is not logged in.'
    };
  }

  const { error } = await supabaseClient
    .from('practice_attempts')
    .insert({
      user_id: user.id,
      challenge_id: challengeId,
      query_text: queryText,
      is_correct: isCorrect
    });

  if (error) {
    console.error('Practice attempt insert error:', error);

    return {
      ok: false,
      msg: error.message
    };
  }

  return {
    ok: true
  };
}