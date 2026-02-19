import { NextRequest, NextResponse } from 'next/server';

// Generate a URL-friendly slug from athlete name
function generateSlug(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase()}-${lastName.toLowerCase()}-${Date.now()}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parent, athlete } = body;

    // Validate input
    if (!parent?.name || !parent?.email || !parent?.phone) {
      return NextResponse.json(
        { error: 'Missing parent information' },
        { status: 400 }
      );
    }

    if (
      !athlete?.firstName ||
      !athlete?.lastName ||
      !athlete?.sport ||
      !athlete?.position
    ) {
      return NextResponse.json(
        { error: 'Missing athlete information' },
        { status: 400 }
      );
    }

    // TODO: In production, these would be actual database operations
    // For now, we'll simulate the process

    // 1. Create user in Supabase Auth (or users table)
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 2. Create athlete record linked to user
    const athleteId = `athlete_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 3. Create athlete_profile with auto-generated slug
    const slug = generateSlug(athlete.firstName, athlete.lastName);

    // 4. Log what would be stored
    console.log('Creating user:', {
      userId,
      parentName: parent.name,
      parentEmail: parent.email,
      parentPhone: parent.phone,
    });

    console.log('Creating athlete:', {
      athleteId,
      userId,
      ...athlete,
    });

    console.log('Creating athlete profile:', {
      athleteId,
      slug,
      firstName: athlete.firstName,
      lastName: athlete.lastName,
      sport: athlete.sport,
      position: athlete.position,
      height: athlete.height,
      weight: athlete.weight,
      gradYear: athlete.gradYear,
      highSchool: athlete.highSchool,
      city: athlete.city,
      state: athlete.state,
      isPrivate: false,
      bio: '',
      viewCount: 0,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      userId,
      athleteId,
      slug,
      message: 'Athlete profile created successfully',
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Signup failed',
      },
      { status: 500 }
    );
  }
}
